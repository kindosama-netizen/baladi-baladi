import { Link } from 'react-router-dom'
import { Phone, MapPin } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

export default function SiteFooter() {
  const s = useSettings()
  return (
    <footer className="bg-ink text-cream/80">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-bold text-amber mb-2">
            {s?.restaurant_name?.split(' - ')[0] || 'بلدي بلدي'}
          </div>
          <p className="text-sm leading-7 text-cream/70 max-w-sm">
            {s?.tagline || 'طعم بلدي .. بمذاق ما بتنساه'}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-display text-cream mb-2">روابط سريعة</div>
          <Link to="/" className="block hover:text-amber">الرئيسية</Link>
          <Link to="/menu" className="block hover:text-amber">المنيو الرقمي</Link>
          <a href="/#offers" className="block hover:text-amber">العروض</a>
          <Link to="/admin/login" className="block hover:text-amber text-cream/40">لوحة التحكم</Link>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-display text-cream mb-2">تواصل معنا</div>
          {s?.phone && (
            <a href={`tel:${s.phone}`} className="flex items-center gap-2 hover:text-amber">
              <Phone size={16} /> {s.phone}
            </a>
          )}
          {s?.address && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> {s.address}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            {s?.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-ink-soft hover:text-amber text-xs font-bold" aria-label="Instagram">
                Instagram
              </a>
            )}
            {s?.facebook_url && (
              <a href={s.facebook_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-ink-soft hover:text-amber text-xs font-bold" aria-label="Facebook">
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10 text-center text-xs text-cream/40 py-4">
        © {new Date().getFullYear()} بلدي بلدي — جميع الحقوق محفوظة
      </div>
    </footer>
  )
}
