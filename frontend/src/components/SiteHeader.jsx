import { Link, NavLink } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

const linkClass = ({ isActive }) =>
  `text-sm md:text-base transition ${isActive ? 'text-amber' : 'text-cream/80 hover:text-cream'}`

export default function SiteHeader() {
  const settings = useSettings()
  const name = settings?.restaurant_name || 'بلدي بلدي'

  return (
    <header className="absolute top-0 inset-x-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          {settings?.logo ? (
            <img src={settings.logo} alt={name} className="h-12 w-12 rounded-full object-cover ring-2 ring-amber/60" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-amber text-ink font-display font-bold grid place-items-center text-lg">
              ب
            </div>
          )}
          <div>
            <div className="font-display font-extrabold text-cream text-lg md:text-xl tracking-tight group-hover:text-amber transition">
              {name.split(' - ')[0] || name}
            </div>
            <div className="text-[11px] text-cream/60 tracking-wide">برجر وفطور</div>
          </div>
        </Link>
        <nav className="flex items-center gap-4 md:gap-7">
          <NavLink to="/" end className={linkClass}>الرئيسية</NavLink>
          <NavLink to="/menu" className={linkClass}>المنيو</NavLink>
          <a href="/#contact" className="text-sm md:text-base text-cream/80 hover:text-cream transition">تواصل</a>
        </nav>
      </div>
    </header>
  )
}
