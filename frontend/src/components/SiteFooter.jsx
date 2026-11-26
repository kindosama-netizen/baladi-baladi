import { Link } from 'react-router-dom'
import { Phone, MapPin, Map } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

export default function SiteFooter() {
  const s = useSettings()
  const name = (s?.restaurant_name || 'بلدي').split(' - ')[0]
  const maps = s?.maps_link || 'https://maps.app.goo.gl/KvMyLqQM7YbGLzeQ8'

  return (
    <footer className="bg-ink text-cream/80">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-display text-3xl font-bold text-amber mb-2">{name}</div>
          <p className="text-sm leading-7 text-cream/70 max-w-sm">
            {s?.tagline || 'طعم بلدي .. بمذاق ما بتنساه'}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-display text-cream mb-2">روابط سريعة</div>
          <Link to="/" className="block hover:text-amber min-h-10 flex items-center">الرئيسية</Link>
          <Link to="/menu" className="block hover:text-amber min-h-10 flex items-center">المنيو الرقمي</Link>
          <a href="/#offers" className="block hover:text-amber min-h-10 flex items-center">العروض</a>
          <a href="/#contact" className="block hover:text-amber min-h-10 flex items-center">موقعنا</a>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-display text-cream mb-2">تواصل معنا</div>
          {s?.phone && (
            <a href={`tel:${s.phone}`} className="flex items-center gap-2 hover:text-amber min-h-10">
              <Phone size={16} /> {s.phone}
            </a>
          )}
          {s?.address && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> {s.address}
            </div>
          )}
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-1 rounded-full bg-amber text-ink font-bold px-4 py-2.5 hover:bg-amber-bright transition"
          >
            <Map size={16} />
            موقعنا على الخريطة
          </a>
        </div>
      </div>
      <div className="border-t border-cream/10 text-center text-xs text-cream/40 py-4">
        © {new Date().getFullYear()} بلدي — جميع الحقوق محفوظة
      </div>
    </footer>
  )
}
