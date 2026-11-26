import { useEffect, useState } from 'react'
import api from '../../api/client'
import ImageField from '../../components/admin/ImageField'

export default function AdminSettings() {
  const [form, setForm] = useState(null)
  const [logo, setLogo] = useState(null)
  const [hero, setHero] = useState(null)
  const [about, setAbout] = useState(null)
  const [hoursText, setHoursText] = useState('{}')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/admin/settings/').then((r) => {
      setForm(r.data)
      setHoursText(JSON.stringify(r.data.working_hours || {}, null, 2))
    })
  }, [])

  async function save(e) {
    e.preventDefault()
    setMsg('')
    let hours
    try {
      hours = JSON.parse(hoursText || '{}')
    } catch {
      setMsg('صيغة ساعات العمل غير صحيحة (JSON)')
      return
    }
    const fd = new FormData()
    const fields = [
      'restaurant_name', 'restaurant_name_en', 'tagline', 'description',
      'hero_headline', 'hero_subtext', 'phone', 'address',
      'maps_embed_url', 'maps_link', 'facebook_url', 'instagram_url', 'public_site_url',
    ]
    fields.forEach((k) => {
      if (form[k] != null) fd.append(k, form[k])
    })
    fd.append('working_hours', JSON.stringify(hours))
    if (logo) fd.append('logo', logo)
    if (hero) fd.append('hero_image', hero)
    if (about) fd.append('about_image', about)
    try {
      const { data } = await api.patch('/admin/settings/', fd)
      setForm(data)
      setHoursText(JSON.stringify(data.working_hours || {}, null, 2))
      setLogo(null)
      setHero(null)
      setAbout(null)
      setMsg('تم حفظ الإعدادات')
    } catch (err) {
      setMsg(JSON.stringify(err.response?.data || err.message))
    }
  }

  if (!form) return <p>جاري التحميل...</p>

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold mb-6">إعدادات الموقع</h1>
      {msg && <p className="mb-4 text-sm text-ember break-all">{msg}</p>}
      <form onSubmit={save} className="bg-white rounded-2xl border p-5 grid md:grid-cols-2 gap-4">
        <Field label="اسم المطعم" value={form.restaurant_name} onChange={(v) => setForm({ ...form, restaurant_name: v })} />
        <Field label="الاسم بالإنجليزية" value={form.restaurant_name_en} onChange={(v) => setForm({ ...form, restaurant_name_en: v })} />
        <Field label="الشعار النصي" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
        <Field label="عنوان الهيرو" value={form.hero_headline} onChange={(v) => setForm({ ...form, hero_headline: v })} />
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1">الوصف</label>
          <textarea className="w-full rounded-xl border px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Field label="نص فرعي للهيرو" value={form.hero_subtext} onChange={(v) => setForm({ ...form, hero_subtext: v })} />
        </div>
        <Field label="الهاتف" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="العنوان" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label="Facebook" value={form.facebook_url} onChange={(v) => setForm({ ...form, facebook_url: v })} />
        <Field label="Instagram" value={form.instagram_url} onChange={(v) => setForm({ ...form, instagram_url: v })} />
        <Field label="رابط خريطة Google" value={form.maps_link} onChange={(v) => setForm({ ...form, maps_link: v })} />
        <Field label="رابط تضمين الخريطة (iframe)" value={form.maps_embed_url} onChange={(v) => setForm({ ...form, maps_embed_url: v })} />
        <div className="md:col-span-2">
          <Field
            label="رابط الموقع العام (لـ QR Codes) — مثال: https://baladi-baladi.onrender.com"
            value={form.public_site_url || ''}
            onChange={(v) => setForm({ ...form, public_site_url: v })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1">ساعات العمل (JSON)</label>
          <textarea className="w-full rounded-xl border px-3 py-2 font-mono text-xs" rows={5} value={hoursText} onChange={(e) => setHoursText(e.target.value)} />
        </div>
        <ImageField label="الشعار" file={logo} onFile={setLogo} previewUrl={form.logo} />
        <ImageField label="صورة الهيرو" file={hero} onFile={setHero} previewUrl={form.hero_image} />
        <ImageField label="صورة عنّا" file={about} onFile={setAbout} previewUrl={form.about_image} />
        <div className="md:col-span-2">
          <button type="submit" className="bg-ink text-cream px-6 py-3 rounded-xl font-bold">حفظ الإعدادات</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input className="w-full rounded-xl border border-cream-muted px-3 py-2" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
