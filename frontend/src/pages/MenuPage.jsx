import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Star } from 'lucide-react'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'

export default function MenuPage() {
  const settings = useSettings()
  const [categories, setCategories] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)
  const brand = (settings?.restaurant_name || 'بلدي').split(' - ')[0]

  useEffect(() => {
    setLoading(true)
    api
      .get('/categories/?include_items=1')
      .then((r) => {
        const cats = r.data.filter((c) => c.is_active !== false)
        setCategories(cats)
        if (cats.length) setActive(cats[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#cat-')) {
      const id = Number(hash.replace('#cat-', ''))
      if (id) setActive(id)
    }
  }, [categories])

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === active),
    [categories, active]
  )

  return (
    <div className="bg-cream min-h-screen pb-20 overflow-x-hidden">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="text-center mb-5">
          <p className="text-ember text-xs font-bold tracking-[0.25em] mb-1">BALADI</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">منيو {brand}</h1>
          <p className="text-smoke text-sm mt-1.5 leading-6">{settings?.tagline || 'طعم بلدي .. بمذاق ما بتنساه'}</p>
        </div>

        {/* Sticky category chips — thumb-friendly */}
        <div className="sticky top-[3.75rem] z-20 -mx-4 px-4 py-2.5 bg-cream/95 backdrop-blur-md border-b border-cream-muted mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar touch-pan-x pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActive(cat.id)
                  window.history.replaceState(null, '', `#cat-${cat.id}`)
                }}
                className={`shrink-0 min-h-11 px-4 py-2.5 rounded-full text-sm font-bold transition active:scale-[0.97] ${
                  active === cat.id
                    ? 'bg-ink text-cream shadow-sm'
                    : 'bg-white text-ink border border-cream-muted'
                }`}
              >
                {cat.name_ar}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-center text-smoke py-16">جاري تحميل المنيو...</p>}

        {!loading && categories.length === 0 && (
          <p className="text-center text-smoke py-16">لا توجد تصنيفات نشطة حالياً.</p>
        )}

        {activeCategory && (
          <motion.div
            key={activeCategory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <h2 className="font-display text-xl font-bold mb-3.5 text-ink">{activeCategory.name_ar}</h2>
            <div className="space-y-3">
              {(activeCategory.items || []).length === 0 && (
                <p className="text-smoke text-sm border border-dashed border-cream-muted rounded-xl p-6 text-center">
                  لا توجد أصناف في هذا التصنيف بعد.
                </p>
              )}
              {(activeCategory.items || []).map((item) => (
                <article
                  key={item.id}
                  className={`flex gap-3 bg-white rounded-2xl border border-cream-muted/90 p-3 shadow-sm ${
                    !item.is_available ? 'opacity-55' : ''
                  }`}
                >
                  <div className="w-[5.5rem] h-[5.5rem] sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-ink relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name_ar} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full texture-warm" />
                    )}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-ink/60 grid place-items-center text-[10px] text-cream font-bold">
                        غير متوفر
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-[15px] sm:text-base leading-snug">{item.name_ar}</h3>
                      <span className="text-ember font-bold text-sm whitespace-nowrap">{item.price} د.أ</span>
                    </div>
                    {item.description_ar && (
                      <p className="text-smoke text-xs leading-5 mt-1 line-clamp-2">{item.description_ar}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.is_popular && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-ember/10 text-ember px-1.5 py-0.5 rounded-full font-bold">
                          <Flame size={10} /> شائع
                        </span>
                      )}
                      {item.is_recommended && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber/20 text-ink px-1.5 py-0.5 rounded-full font-bold">
                          <Star size={10} /> موصى
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
