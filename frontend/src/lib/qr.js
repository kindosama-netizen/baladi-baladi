import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { doc, getDoc } from 'firebase/firestore'
import { db, PUBLIC_SITE_URL } from './firebase'

export async function getMenuUrl() {
  const snap = await getDoc(doc(db, 'site_settings', 'main'))
  const data = snap.exists() ? snap.data() : {}
  const base = (data?.public_site_url || PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')
  return {
    menuUrl: `${base}/menu`,
    brand: data || {},
  }
}

export async function generateQrPngBlob(url) {
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 1024,
    color: { dark: '#1c1612', light: '#ffffff' },
  })
  const res = await fetch(dataUrl)
  return res.blob()
}

function loadFontFace(family, url) {
  const font = new FontFace(family, `url(${url})`)
  return font.load().then((f) => {
    document.fonts.add(f)
    return family
  })
}

async function ensureArabicFonts() {
  try {
    await Promise.all([
      loadFontFace('NotoNaskh', '/fonts/NotoNaskhArabic-Regular.ttf'),
      loadFontFace('NotoNaskhBold', '/fonts/NotoNaskhArabic-Bold.ttf'),
    ])
  } catch {
    // fallback to CSS fonts already on page
  }
}

/** Branded A6 @ ~300dpi printable card */
export async function generateMenuCardPngBlob() {
  await ensureArabicFonts()
  const { menuUrl, brand } = await getMenuUrl()
  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 680,
    color: { dark: '#1c1612', light: '#ffffff' },
  })

  const width = 1240
  const height = 1748
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const BG = '#16110e'
  const AMBER = '#d4a04a'
  const CREAM = '#faf4ea'
  const SOFT = '#b4aa9b'

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = AMBER
  ctx.fillRect(0, 0, width, 22)
  ctx.fillRect(0, height - 22, width, 22)
  ctx.fillRect(0, 22, 10, height - 44)
  ctx.fillRect(width - 10, 22, 10, height - 44)

  const nameAr = (brand.restaurant_name || 'بلدي').split(' - ')[0]
  const nameEn = (brand.restaurant_name_en || 'Baladi').split(' - ')[0]
  const tagline = brand.tagline || 'طعم بلدي .. بمذاق ما بتنساه'

  const center = (text, y, size, color, bold = false, latin = false) => {
    ctx.fillStyle = color
    ctx.font = `${bold ? '700' : '400'} ${size}px ${latin ? 'Roboto, Arial, sans-serif' : 'NotoNaskhBold, NotoNaskh, Cairo, sans-serif'}`
    ctx.textAlign = 'center'
    ctx.direction = latin ? 'ltr' : 'rtl'
    ctx.fillText(text, width / 2, y)
  }

  center(nameAr, 130, 92, AMBER, true)
  center(nameEn, 200, 38, CREAM, true, true)
  center(tagline, 270, 34, SOFT, false)
  center('امسح الرمز لفتح المنيو الرقمي', 340, 40, CREAM, true)
  center('SCAN FOR OUR DIGITAL MENU', 395, 28, AMBER, true, true)

  // QR panel
  const panel = 760
  const panelX = (width - panel) / 2
  const panelY = 440
  roundRect(ctx, panelX - 4, panelY - 4, panel + 8, panel + 8, 36, AMBER, true)
  roundRect(ctx, panelX, panelY, panel, panel, 32, CREAM, false)
  const qrImg = await loadImage(qrDataUrl)
  const qrSize = 680
  const qx = panelX + (panel - qrSize) / 2
  const qy = panelY + (panel - qrSize) / 2
  ctx.drawImage(qrImg, qx, qy, qrSize, qrSize)

  center('فطور، برجر، مشاوي، وجبات', 1320, 34, AMBER, false)
  center('بدون تطبيق، افتح الرابط وتصفح فورا', 1390, 30, SOFT, false)
  if (brand.phone) center(brand.phone, 1480, 40, CREAM, true, true)
  const address = (brand.address || 'إربد، شارع البتراء').split(',')[0]
  center(address.replace(/\//g, '،'), 1550, 30, SOFT, false)
  center('بلدي، طعم ما بتنساه', 1635, 34, AMBER, true)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob
}

export async function generateMenuPdfBlob() {
  const cardBlob = await generateMenuCardPngBlob()
  const cardUrl = URL.createObjectURL(cardBlob)
  const img = await loadImage(cardUrl)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cardW = 105
  const cardH = 148
  const gap = 8
  const pageW = 210
  const pageH = 297
  const startX = (pageW - 2 * cardW - gap) / 2
  const positions = [
    [startX, 15],
    [startX + cardW + gap, 15],
    [startX, pageH - 15 - cardH],
    [startX + cardW + gap, pageH - 15 - cardH],
  ]

  positions.forEach(([x, y], i) => {
    pdf.addImage(img, 'PNG', x, y, cardW, cardH)
    pdf.setDrawColor(160)
    pdf.setLineDashPattern([2, 2], 0)
    pdf.rect(x, y, cardW, cardH)
    if (i < 3) {
      // stay on same page
    }
  })

  URL.revokeObjectURL(cardUrl)
  return pdf.output('blob')
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r, color, strokeOnly) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  if (strokeOnly) {
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.stroke()
  } else {
    ctx.fillStyle = color
    ctx.fill()
  }
}
