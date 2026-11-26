import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../api/client'
import {
  LayoutDashboard,
  FolderOpen,
  UtensilsCrossed,
  Megaphone,
  QrCode,
  Settings,
  LogOut,
} from 'lucide-react'

const links = [
  { to: '/admin', end: true, label: 'نظرة عامة', icon: LayoutDashboard },
  { to: '/admin/categories', label: 'التصنيفات', icon: FolderOpen },
  { to: '/admin/items', label: 'أصناف المنيو', icon: UtensilsCrossed },
  { to: '/admin/ads', label: 'الإعلانات', icon: Megaphone },
  { to: '/admin/tables', label: 'الطاولات و QR', icon: QrCode },
  { to: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream-muted/40 flex flex-col md:flex-row" dir="rtl">
      <aside className="md:w-64 bg-ink text-cream shrink-0">
        <div className="p-5 border-b border-cream/10">
          <div className="font-display text-xl font-bold text-amber">بلدي بلدي</div>
          <div className="text-xs text-cream/50 mt-1">لوحة التحكم</div>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition ${
                  isActive ? 'bg-amber text-ink font-bold' : 'hover:bg-ink-soft text-cream/80'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/admin/login')
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-cream/50 hover:text-cream hover:bg-ink-soft"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </nav>
      </aside>
      <div className="flex-1 p-4 md:p-8 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  )
}
