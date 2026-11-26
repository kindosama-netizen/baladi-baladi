import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

export default function SiteHeader() {
  const settings = useSettings()
  const { pathname } = useLocation()
  const onDark = pathname === '/'
  const name = (settings?.restaurant_name || 'بلدي').split(' - ')[0]

  const linkClass = ({ isActive }) =>
    `text-sm md:text-base font-medium transition min-h-11 inline-flex items-center px-1 ${
      isActive
        ? onDark
          ? 'text-amber'
          : 'text-ember'
        : onDark
          ? 'text-cream/85 hover:text-cream'
          : 'text-ink/75 hover:text-ink'
    }`

  return (
    <header
      className={`z-40 ${
        onDark
          ? 'absolute top-0 inset-x-0'
          : 'sticky top-0 inset-x-0 bg-cream/95 backdrop-blur-md border-b border-cream-muted/80'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-3.5 md:py-5 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group min-h-11">
          {settings?.logo ? (
            <img
              src={settings.logo}
              alt={name}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-amber/70"
            />
          ) : (
            <div
              className={`h-11 w-11 rounded-full font-display font-black grid place-items-center text-lg ${
                onDark ? 'bg-amber text-ink' : 'bg-ink text-amber'
              }`}
            >
              ب
            </div>
          )}
          <div>
            <div
              className={`font-display font-extrabold text-xl md:text-2xl tracking-tight leading-none group-hover:text-amber transition ${
                onDark ? 'text-cream' : 'text-ink'
              }`}
            >
              {name}
            </div>
            <div className={`text-[11px] tracking-wide mt-0.5 ${onDark ? 'text-cream/55' : 'text-smoke'}`}>
              برجر وفطور
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 md:gap-7">
          <NavLink to="/" end className={linkClass}>
            الرئيسية
          </NavLink>
          <NavLink to="/menu" className={linkClass}>
            المنيو
          </NavLink>
          <a
            href="/#contact"
            className={`text-sm md:text-base font-medium transition min-h-11 inline-flex items-center ${
              onDark ? 'text-cream/85 hover:text-cream' : 'text-ink/75 hover:text-ink'
            }`}
          >
            موقعنا
          </a>
        </nav>
      </div>
    </header>
  )
}
