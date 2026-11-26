import { useEffect, useState } from 'react'
import api from '../../api/client'
import ImageField from '../../components/admin/ImageField'

const empty = {
  title_ar: '',
  description_ar: '',
  promo_price: '',
  discount_percent: '',
  cta_text: 'اطلب الآن',
  cta_link: '/menu',
  placement: 'banner',
  start_at: '',
  end_at: '',
  is_active: true,
  sort_order: 0,
}

export default function AdminAds() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState(null)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => api.get('/advertisements/?preview=1').then((r) => setItems(r.data))
  useEffect(() => { load() }, [])

  function toLocalInput(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function save(e) {
    e.preventDefault()
    setMsg('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v === '' || v === null) return
      if (typeof v === 'boolean') fd.append(k, v ? 'true' : 'false')
      else if (k === 'start_at' || k === 'end_at') fd.append(k, new Date(v).toISOString())
      else fd.append(k, v)
    })
    if (image) fd.append('image', image)
    try {
      if (editing) await api.patch(`/advertisements/${editing}/`, fd)
      else await api.post('/advertisements/', fd)
      setForm(empty)
      setImage(null)
      setEditing(null)
      setMsg('تم الحفظ')
      load()
    } catch (err) {
      setMsg(JSON.stringify(err.response?.data || err.message))
    }
  }

  async function remove(id) {
    if (!confirm('حذف الإعلان؟')) return
    await api.delete(`/advertisements/${id}/`)
    load()
  }

  function startEdit(ad) {
    setEditing(ad.id)
    setForm({
      title_ar: ad.title_ar,
      description_ar: ad.description_ar || '',
      promo_price: ad.promo_price ?? '',
      discount_percent: ad.discount_percent ?? '',
      cta_text: ad.cta_text || 'اطلب الآن',
      cta_link: ad.cta_link || '/menu',
      placement: ad.placement,
      start_at: toLocalInput(ad.start_at),
      end_at: toLocalInput(ad.end_at),
      is_active: ad.is_active,
      sort_order: ad.sort_order,
    })
    setImage(null)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold mb-6">الإعلانات والعروض</h1>
      {msg && <p className="mb-4 text-sm text-ember break-all">{msg}</p>}

      <form onSubmit={save} className="bg-white rounded-2xl border border-cream-muted p-5 mb-8 grid md:grid-cols-2 gap-4">
        <Field label="العنوان" value={form.title_ar} onChange={(v) => setForm({ ...form, title_ar: v })} required />
        <div>
          <label className="block text-sm font-bold mb-1">مكان الظهور</label>
          <select className="w-full rounded-xl border px-3 py-2" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            <option value="banner">إعلان مميز (الرئيسية)</option>
            <option value="offers">عروض خاصة</option>
            <option value="hero">بانر رئيسي</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1">الوصف</label>
          <textarea className="w-full rounded-xl border px-3 py-2" rows={2} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
        </div>
        <Field label="سعر ترويجي" type="number" step="0.01" value={form.promo_price} onChange={(v) => setForm({ ...form, promo_price: v })} />
        <Field label="نسبة الخصم %" type="number" value={form.discount_percent} onChange={(v) => setForm({ ...form, discount_percent: v })} />
        <Field label="بداية العرض" type="datetime-local" value={form.start_at} onChange={(v) => setForm({ ...form, start_at: v })} />
        <Field label="نهاية العرض" type="datetime-local" value={form.end_at} onChange={(v) => setForm({ ...form, end_at: v })} />
        <Field label="نص الزر" value={form.cta_text} onChange={(v) => setForm({ ...form, cta_text: v })} />
        <Field label="رابط الزر" value={form.cta_link} onChange={(v) => setForm({ ...form, cta_link: v })} />
        <ImageField label="صورة الإعلان" file={image} onFile={setImage} />
        <label className="flex items-center gap-2 text-sm font-bold self-end pb-2">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          نشط
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button type="submit" className="bg-ink text-cream px-5 py-2.5 rounded-xl font-bold">{editing ? 'تحديث' : 'إنشاء'}</button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border font-bold"
            onClick={() => setPreview({ ...form, image: image ? URL.createObjectURL(image) : items.find((i) => i.id === editing)?.image })}
          >
            معاينة قبل النشر
          </button>
          {editing && <button type="button" className="px-4 py-2.5 rounded-xl border" onClick={() => { setEditing(null); setForm(empty); setImage(null) }}>إلغاء</button>}
        </div>
      </form>

      {preview && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-amber bg-ink text-cream">
          <div className="grid md:grid-cols-2">
            {preview.image && <img src={preview.image} alt="" className="h-48 w-full object-cover" />}
            <div className="p-6">
              <div className="text-amber text-xs mb-1">معاينة</div>
              <div className="font-display text-2xl font-bold mb-2">{preview.title_ar || 'عنوان الإعلان'}</div>
              <p className="text-cream/70 text-sm mb-3">{preview.description_ar}</p>
              {preview.discount_percent && <span className="text-xs bg-amber text-ink px-2 py-1 rounded-full font-bold">خصم {preview.discount_percent}%</span>}
              <button type="button" className="block mt-4 text-xs underline" onClick={() => setPreview(null)}>إغلاق المعاينة</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((ad) => (
          <div key={ad.id} className="bg-white rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold">{ad.title_ar}</div>
              <div className="text-xs text-smoke">
                {ad.placement} · {ad.is_currently_visible ? 'ظاهر للعامة' : 'غير ظاهر'} · {ad.is_active ? 'مفعّل' : 'متوقف'}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(ad)} className="px-3 py-1.5 rounded-lg bg-cream-muted text-sm">تعديل</button>
              <button type="button" onClick={() => remove(ad.id)} className="px-3 py-1.5 rounded-lg bg-ember/10 text-ember text-sm">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, step }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input
        type={type}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cream-muted px-3 py-2 bg-white"
      />
    </div>
  )
}
