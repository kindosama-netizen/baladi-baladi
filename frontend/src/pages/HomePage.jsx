import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Flame } from 'lucide-react'
import api from '../api/client'
import { useSettings } from '../context/SettingsContext'

export default function HomePage() {
  const settings = useSettings()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [ads, setAds] = useState([])
  const [offers, setOffers] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/categories/?include_items=0'),
      api.get('/menu-items/'),
      api.get('/advertisements/?placement=banner'),
      api.get('/advertisements/?placement=offers'),
    ]).then(([c, i, b, o]) => {
      setCategories(c.data)
      setItems(i.data)
      setAds(b.data)
      setOffers(o.data)
    }).catch(console.error)
  }, [])

  const featured = items.filter((x) => x.is_popular || x.is_recommended).slice(0, 6)
  const featuredAd = ads[0]
  const hours = settings?.working_hours || {}

  return (
    <div>
      {/* Hero — brand first, full-bleed */}
      <section className="relative min-h-[100svh] texture-warm overflow-hidden">
        {settings?.hero_image && (
          <img
            src={settings.hero_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20 min-h-[100svh] flex flex-col justify-end md:justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              {settings?.logo ? (
                <img src={settings.logo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-amber" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-amber text-ink font-display font-black text-2xl grid place-items-center">ب</div>
              )}
              <div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold text-cream leading-tight">
                  {settings?.restaurant_name?.split(' - ')[0] || 'بلدي بلدي'}
                </h1>
                <p className="text-amber tracking-wide text-sm md:text-base mt-1">Baladi Baladi · برجر وفطور</p>
              </div>
            </div>
            <p className="font-display text-2xl md:text-3xl text-cream/95 font-semibold mb-3 animate-float-in-delay">
              {settings?.hero_headline || settings?.tagline || 'طعم بلدي بمذاق ما بتنساه'}
            </p>
            <p className="text-cream/75 text-base md:text-lg leading-8 mb-8 max-w-xl animate-float-in-delay-2">
              {settings?.hero_subtext || settings?.description}
            </p>
            <div className="flex flex-wrap gap-3 animate-float-in-delay-2">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-amber text-ink font-bold px-6 py-3.5 rounded-full hover:bg-amber-bright transition shadow-lg shadow-amber/20"
              >
                استكشف المنيو
                <ArrowLeft size={18} />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 border border-cream/30 text-cream px-6 py-3.5 rounded-full hover:bg-cream/10 transition"
              >
                تواصل معنا
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured advertisement */}
      {featuredAd && (
        <section className="bg-ink-soft py-10 md:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-ember/80 to-ink border border-amber/20"
            >
              <div className="grid md:grid-cols-2 gap-0 items-stretch">
                {featuredAd.image && (
                  <div className="min-h-56 md:min-h-72">
                    <img src={featuredAd.image} alt={featuredAd.title_ar} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-8 md:p-10 flex flex-col justify-center text-cream">
                  <div className="text-amber text-xs font-bold tracking-widest mb-2">إعلان مميز</div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{featuredAd.title_ar}</h2>
                  {featuredAd.description_ar && (
                    <p className="text-cream/75 leading-7 mb-4">{featuredAd.description_ar}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    {featuredAd.discount_percent != null && (
                      <span className="bg-amber text-ink text-sm font-bold px-3 py-1 rounded-full">
                        خصم {featuredAd.discount_percent}%
                      </span>
                    )}
                    {featuredAd.promo_price != null && (
                      <span className="text-amber font-bold text-xl">{featuredAd.promo_price} د.أ</span>
                    )}
                    <Link to={featuredAd.cta_link || '/menu'} className="text-sm underline underline-offset-4 hover:text-amber">
                      {featuredAd.cta_text || 'اطلب الآن'}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Menu categories */}
      <section id="menu" className="py-16 md:py-20 bg-cream">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-ink">منيو بلدي بلدي</h2>
            <p className="text-smoke mt-2">تصفّح التصنيفات واكتشف نكهاتنا</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/menu#cat-${cat.id}`}
                  className="block group relative overflow-hidden rounded-2xl bg-ink min-h-36 md:min-h-44"
                >
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name_ar} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="absolute inset-0 texture-warm opacity-90" />
                  )}
                  <div className="relative z-10 h-full min-h-36 md:min-h-44 p-4 flex flex-col justify-end">
                    <div className="font-display text-xl font-bold text-cream">{cat.name_ar}</div>
                    <div className="text-cream/60 text-xs mt-1">{cat.items_count || 0} صنف</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {featured.length > 0 && (
            <>
              <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <Flame className="text-ember" size={22} /> الأكثر طلباً والمُوصى به
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}

          {items.length === 0 && (
            <div className="text-center py-12 text-smoke border border-dashed border-cream-muted rounded-2xl">
              المنيو جاهز للإضافة من لوحة التحكم — التصنيفات متاحة الآن.
              <div className="mt-4">
                <Link to="/menu" className="text-amber font-bold">عرض صفحة المنيو ←</Link>
              </div>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link to="/menu" className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3 rounded-full font-bold hover:bg-ink-soft transition">
              عرض المنيو الكامل
              <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-20 bg-cream-muted/50">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">قصتنا</h2>
            <p className="text-ink/80 leading-8 text-lg mb-4">
              {settings?.description}
            </p>
            <p className="text-smoke leading-7">
              من قلب إربد — شارع البتراء، نقدّم تجربة برجر وفطور بطابع بلدي أصيل. كل لقمة مصنوعة بعناية لتعيش طعم ما يتنساش.
            </p>
          </div>
          <div className="relative min-h-72 rounded-3xl overflow-hidden bg-ink">
            {settings?.about_image || settings?.hero_image ? (
              <img
                src={settings.about_image || settings.hero_image}
                alt="بلدي بلدي"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 texture-warm flex items-center justify-center">
                <div className="text-center text-cream px-6">
                  <div className="font-display text-4xl font-bold text-amber mb-2">بلدي بلدي</div>
                  <div className="text-cream/70">فطور • برجر • وجبات</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Special offers */}
      <section id="offers" className="py-16 md:py-20 bg-ink text-cream">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2">عروض خاصة</h2>
          <p className="text-cream/60 mb-8">عروضنا النشطة حالياً</p>
          {offers.length === 0 ? (
            <p className="text-cream/50 border border-dashed border-cream/20 rounded-2xl p-8 text-center">
              لا توجد عروض منشورة حالياً — يمكن إضافتها من لوحة التحكم.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-amber/25 bg-ink-soft overflow-hidden flex flex-col sm:flex-row">
                  {offer.image && (
                    <img src={offer.image} alt="" className="sm:w-40 h-36 sm:h-auto object-cover" />
                  )}
                  <div className="p-5 flex-1">
                    <div className="font-display text-xl font-bold text-amber mb-1">{offer.title_ar}</div>
                    <p className="text-sm text-cream/70 leading-6 mb-3">{offer.description_ar}</p>
                    {offer.discount_percent != null && (
                      <span className="text-xs bg-ember px-2 py-1 rounded-full">خصم {offer.discount_percent}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-20 bg-cream">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-2">تواصل وموقعنا</h2>
          <p className="text-smoke mb-8">ننتظر زيارتكم في إربد</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 text-ink/90">
              {settings?.phone && (
                <a href={`tel:${settings.phone}`} className="block text-lg font-bold text-ember hover:underline">
                  📞 {settings.phone}
                </a>
              )}
              <p>{settings?.address}</p>
              {Object.keys(hours).length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="font-display font-bold">ساعات العمل</div>
                  {Object.entries(hours).map(([day, time]) => (
                    <div key={day} className="flex justify-between gap-4 text-sm border-b border-cream-muted py-2">
                      <span>{day}</span>
                      <span className="text-smoke">{time}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-sm underline hover:text-ember">Instagram</a>
                )}
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-sm underline hover:text-ember">Facebook</a>
                )}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden bg-cream-muted min-h-64 border border-cream-muted">
              {settings?.maps_embed_url ? (
                <iframe
                  title="موقع بلدي بلدي"
                  src={settings.maps_embed_url}
                  className="w-full h-full min-h-64 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="h-full min-h-64 grid place-items-center text-smoke text-sm p-6 text-center">
                  رابط خريطة Google قابل للتعديل من لوحة التحكم
                  {settings?.maps_link && (
                    <a href={settings.maps_link} className="mt-3 text-ember underline" target="_blank" rel="noreferrer">
                      فتح الموقع
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FoodCard({ item }) {
  return (
    <article className={`rounded-2xl overflow-hidden bg-white border border-cream-muted shadow-sm ${!item.is_available ? 'opacity-60' : ''}`}>
      <div className="aspect-[4/3] bg-ink relative overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name_ar} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full texture-warm grid place-items-center text-cream/40 text-sm">بدون صورة</div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {item.is_popular && (
            <span className="bg-ember text-cream text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Flame size={10} /> شائع
            </span>
          )}
          {item.is_recommended && (
            <span className="bg-amber text-ink text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Star size={10} /> موصى
            </span>
          )}
        </div>
        {!item.is_available && (
          <div className="absolute inset-0 bg-ink/50 grid place-items-center text-cream font-bold">غير متوفر</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display font-bold text-lg">{item.name_ar}</h4>
          <span className="text-ember font-bold whitespace-nowrap">{item.price} د.أ</span>
        </div>
        {item.description_ar && (
          <p className="text-smoke text-sm mt-1 leading-6 line-clamp-2">{item.description_ar}</p>
        )}
      </div>
    </article>
  )
}
