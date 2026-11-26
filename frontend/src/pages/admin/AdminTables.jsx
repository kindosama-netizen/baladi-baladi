import { useEffect, useState } from 'react'
import api from '../../api/client'

export default function AdminTables() {
  const [menuUrl, setMenuUrl] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/tables/menu_url/').then((r) => setMenuUrl(r.data.menu_url)).catch(() => {
      api.get('/settings/').then((r) => {
        const base = (r.data.public_site_url || window.location.origin).replace(/\/$/, '')
        setMenuUrl(`${base}/menu`)
      })
    })
  }, [])

  async function download(path, filename) {
    setMsg('')
    const token = localStorage.getItem('baladi_access')
    const res = await fetch(`/api${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      setMsg('فشل التنزيل — تأكد من تسجيل الدخول')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold mb-2">رمز QR للمنيو</h1>
      <p className="text-smoke mb-6 text-sm leading-7 max-w-2xl">
        رمز واحد موحّد لكل طاولات المطعم يفتح المنيو الرقمي مباشرة.
        حدّث رابط الموقع العام من الإعدادات ثم أعد تنزيل البطاقة قبل الطباعة.
      </p>
      {msg && <p className="mb-4 text-sm text-ember">{msg}</p>}

      <div className="bg-white rounded-3xl border border-cream-muted p-6 md:p-8 mb-6">
        <div className="text-xs font-bold tracking-wide text-smoke mb-2">رابط المنيو المرتبط بالرمز</div>
        <a href={menuUrl || '/menu'} target="_blank" rel="noreferrer" className="text-ember font-bold break-all underline underline-offset-4">
          {menuUrl || '…'}
        </a>

        <div className="grid sm:grid-cols-3 gap-3 mt-8">
          <button
            type="button"
            onClick={() => download('/tables/menu_qr/', 'baladi-menu-qr.png')}
            className="rounded-2xl bg-cream-muted px-4 py-4 font-bold hover:bg-cream transition"
          >
            تنزيل QR عالي الجودة
          </button>
          <button
            type="button"
            onClick={() => download('/tables/menu_card/', 'baladi-menu-qr-card.png')}
            className="rounded-2xl bg-amber/40 px-4 py-4 font-bold hover:bg-amber/55 transition"
          >
            بطاقة طباعة PNG
          </button>
          <button
            type="button"
            onClick={() => download('/tables/menu_pdf/', 'baladi-menu-qr-cards.pdf')}
            className="rounded-2xl bg-ink text-cream px-4 py-4 font-bold hover:bg-ink-soft transition"
          >
            PDF للطباعة (4 بطاقات A6)
          </button>
        </div>

        <ul className="mt-6 text-sm text-smoke space-y-2 list-disc pr-5">
          <li>حجم البطاقة للطباعة: 105×148 مم (A6) بدقة 300 DPI</li>
          <li>اطبع على ورق سميك أو ضع البطاقة داخل حامل طاولة</li>
          <li>نفس الرمز يُستخدم على كل الطاولات — لا حاجة لرمز مختلف لكل طاولة</li>
        </ul>
      </div>
    </div>
  )
}
