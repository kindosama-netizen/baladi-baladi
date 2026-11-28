import { useEffect, useState } from 'react'
import { downloadBlob, generateMenuCardPngBlob, generateMenuPdfBlob, generateQrPngBlob, getMenuUrl } from '../../lib/qr'

export default function AdminTables() {
  const [menuUrl, setMenuUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    getMenuUrl()
      .then((r) => setMenuUrl(r.menuUrl))
      .catch(() => setMenuUrl(`${window.location.origin}/menu`))
  }, [])

  async function run(label, fn, filename) {
    setMsg('')
    setBusy(label)
    try {
      const blob = await fn()
      downloadBlob(blob, filename)
      setMsg('تم التنزيل')
    } catch (err) {
      setMsg(err.message || 'فشل التنزيل')
    } finally {
      setBusy('')
    }
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
            disabled={Boolean(busy)}
            onClick={() => run('qr', async () => generateQrPngBlob(menuUrl), 'baladi-menu-qr.png')}
            className="rounded-2xl bg-cream-muted px-4 py-4 font-bold hover:bg-cream transition disabled:opacity-60"
          >
            {busy === 'qr' ? '...' : 'تنزيل QR عالي الجودة'}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run('card', generateMenuCardPngBlob, 'baladi-menu-qr-card.png')}
            className="rounded-2xl bg-amber/40 px-4 py-4 font-bold hover:bg-amber/55 transition disabled:opacity-60"
          >
            {busy === 'card' ? '...' : 'بطاقة طباعة PNG'}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run('pdf', generateMenuPdfBlob, 'baladi-menu-qr-cards.pdf')}
            className="rounded-2xl bg-ink text-cream px-4 py-4 font-bold hover:bg-ink-soft transition disabled:opacity-60"
          >
            {busy === 'pdf' ? '...' : 'PDF للطباعة (4 بطاقات A6)'}
          </button>
        </div>

        <ul className="mt-6 text-sm text-smoke space-y-2 list-disc pr-5">
          <li>حجم البطاقة للطباعة: 105×148 مم (A6)</li>
          <li>اطبع على ورق سميك أو ضع البطاقة داخل حامل طاولة</li>
          <li>نفس الرمز يُستخدم على كل الطاولات</li>
        </ul>
      </div>
    </div>
  )
}
