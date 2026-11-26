import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/admin/stats/').then((r) => setStats(r.data)).catch(console.error)
  }, [])

  const cards = [
    { label: 'التصنيفات', value: stats?.categories, to: '/admin/categories' },
    { label: 'أصناف المنيو', value: stats?.menu_items, to: '/admin/items' },
    { label: 'إعلانات نشطة', value: stats?.active_advertisements, to: '/admin/ads' },
    { label: 'الطاولات', value: stats?.tables, to: '/admin/tables' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold mb-2">نظرة عامة</h1>
      <p className="text-smoke mb-8">إدارة مطعم بلدي بسهولة</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-white rounded-2xl p-5 border border-cream-muted hover:border-amber transition">
            <div className="text-smoke text-sm">{c.label}</div>
            <div className="font-display text-4xl font-bold text-ink mt-2">{c.value ?? '—'}</div>
          </Link>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Quick to="/admin/items" label="إضافة صنف جديد" />
        <Quick to="/admin/ads" label="إنشاء إعلان" />
        <Quick to="/admin/tables" label="تنزيل رمز QR للمنيو" />
        <Quick to="/admin/settings" label="تعديل بيانات المطعم" />
        <a href="/" target="_blank" rel="noreferrer" className="bg-ink text-cream rounded-xl px-4 py-3 font-bold text-center hover:bg-ink-soft">
          معاينة الموقع
        </a>
        <a href="/menu" target="_blank" rel="noreferrer" className="bg-amber text-ink rounded-xl px-4 py-3 font-bold text-center hover:bg-amber-bright">
          معاينة المنيو
        </a>
      </div>
    </div>
  )
}

function Quick({ to, label }) {
  return (
    <Link to={to} className="bg-white border border-cream-muted rounded-xl px-4 py-3 font-bold text-center hover:border-amber">
      {label}
    </Link>
  )
}
