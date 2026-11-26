import { useEffect, useState } from 'react'
import api from '../../api/client'

export default function AdminTables() {
  const [tables, setTables] = useState([])
  const [number, setNumber] = useState('')
  const [label, setLabel] = useState('')
  const [bulk, setBulk] = useState(10)
  const [msg, setMsg] = useState('')

  const load = () => api.get('/tables/').then((r) => setTables(r.data))
  useEffect(() => { load() }, [])

  async function addTable(e) {
    e.preventDefault()
    setMsg('')
    try {
      await api.post('/tables/', { number: Number(number), label: label || `طاولة ${number}`, is_active: true })
      setNumber('')
      setLabel('')
      load()
    } catch (err) {
      setMsg(JSON.stringify(err.response?.data || err.message))
    }
  }

  async function bulkCreate() {
    setMsg('')
    const { data } = await api.post('/tables/bulk_create/', { count: Number(bulk) })
    setMsg(`تم إنشاء ${data.created.length} طاولة. الإجمالي: ${data.total}`)
    load()
  }

  async function remove(id) {
    if (!confirm('حذف الطاولة؟')) return
    await api.delete(`/tables/${id}/`)
    load()
  }

  async function download(path, filename) {
    const token = localStorage.getItem('baladi_access')
    const res = await fetch(`/api${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      setMsg('فشل التنزيل')
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
      <h1 className="font-display text-3xl font-extrabold mb-2">الطاولات ورموز QR</h1>
      <p className="text-smoke mb-6 text-sm">
        رموز QR تستخدم رابط الموقع العام من الإعدادات (`PUBLIC_SITE_URL`). بعد النشر على Render حدّث الرابط ثم أعد تنزيل البطاقات.
      </p>
      {msg && <p className="mb-4 text-sm text-ember break-all">{msg}</p>}

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <form onSubmit={addTable} className="bg-white rounded-2xl border p-5 space-y-3">
          <div className="font-bold mb-2">إضافة طاولة</div>
          <input type="number" required placeholder="رقم الطاولة" value={number} onChange={(e) => setNumber(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
          <input placeholder="تسمية اختيارية" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
          <button type="submit" className="bg-ink text-cream px-4 py-2 rounded-xl font-bold">إضافة</button>
        </form>
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <div className="font-bold mb-2">إنشاء سريع 1…N</div>
          <input type="number" min={1} max={100} value={bulk} onChange={(e) => setBulk(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
          <button type="button" onClick={bulkCreate} className="bg-amber text-ink px-4 py-2 rounded-xl font-bold">توليد الطاولات</button>
          <button
            type="button"
            onClick={() => download('/tables/pdf/', 'baladi-table-qr-cards.pdf')}
            className="block w-full border border-ink px-4 py-2 rounded-xl font-bold"
          >
            تنزيل PDF بطاقات الطباعة (كل الطاولات)
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tables.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold">طاولة {t.number} {t.label ? `— ${t.label}` : ''}</div>
              <a href={t.menu_url} target="_blank" rel="noreferrer" className="text-xs text-ember underline break-all">{t.menu_url}</a>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="text-sm px-3 py-1.5 rounded-lg bg-cream-muted" onClick={() => download(`/tables/${t.id}/qr/`, `table-${t.number}-qr.png`)}>
                QR PNG
              </button>
              <button type="button" className="text-sm px-3 py-1.5 rounded-lg bg-amber/30 font-bold" onClick={() => download(`/tables/${t.id}/card/`, `table-${t.number}-card.png`)}>
                بطاقة طباعة
              </button>
              <button type="button" className="text-sm px-3 py-1.5 rounded-lg bg-ember/10 text-ember" onClick={() => remove(t.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
