import { useEffect, useState } from 'react'
import api from '../../api/client'
import ImageField from '../../components/admin/ImageField'

const empty = {
  category: '',
  name_ar: '',
  description_ar: '',
  price: '',
  is_popular: false,
  is_recommended: false,
  is_available: true,
  sort_order: 0,
}

export default function AdminItems() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState(null)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => {
    api.get('/menu-items/').then((r) => setItems(r.data))
    api.get('/categories/').then((r) => setCategories(r.data))
  }
  useEffect(() => { load() }, [])

  async function save(e) {
    e.preventDefault()
    setMsg('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === 'boolean') fd.append(k, v ? 'true' : 'false')
      else fd.append(k, v)
    })
    if (image) fd.append('image', image)
    try {
      if (editing) await api.patch(`/menu-items/${editing}/`, fd)
      else await api.post('/menu-items/', fd)
      setForm({ ...empty, category: categories[0]?.id || '' })
      setImage(null)
      setEditing(null)
      setMsg('تم الحفظ')
      load()
    } catch (err) {
      setMsg(JSON.stringify(err.response?.data || err.message))
    }
  }

  async function remove(id) {
    if (!confirm('حذف الصنف؟')) return
    await api.delete(`/menu-items/${id}/`)
    load()
  }

  function startEdit(item) {
    setEditing(item.id)
    setForm({
      category: item.category,
      name_ar: item.name_ar,
      description_ar: item.description_ar || '',
      price: item.price,
      is_popular: item.is_popular,
      is_recommended: item.is_recommended,
      is_available: item.is_available,
      sort_order: item.sort_order,
    })
    setImage(null)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold mb-6">أصناف المنيو</h1>
      {msg && <p className="mb-4 text-sm break-all text-ember">{msg}</p>}
      <form onSubmit={save} className="bg-white rounded-2xl border border-cream-muted p-5 mb-8 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">التصنيف</label>
          <select
            required
            className="w-full rounded-xl border border-cream-muted px-3 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">اختر</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ar}</option>
            ))}
          </select>
        </div>
        <Field label="الاسم" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} required />
        <Field label="السعر (د.أ)" type="number" step="0.01" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
        <Field label="الترتيب" type="number" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1">الوصف</label>
          <textarea
            className="w-full rounded-xl border border-cream-muted px-3 py-2"
            rows={2}
            value={form.description_ar}
            onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
          />
        </div>
        <ImageField label="صورة الصنف" file={image} onFile={setImage} previewUrl={editing ? items.find((i) => i.id === editing)?.image : null} />
        <div className="flex flex-wrap gap-4 self-end pb-2 text-sm font-bold">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> متوفر</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} /> شائع</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_recommended} onChange={(e) => setForm({ ...form, is_recommended: e.target.checked })} /> موصى به</label>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-ink text-cream px-5 py-2.5 rounded-xl font-bold">{editing ? 'تحديث' : 'إضافة'}</button>
          {editing && <button type="button" className="px-4 py-2.5 rounded-xl border" onClick={() => { setEditing(null); setForm(empty); setImage(null) }}>إلغاء</button>}
        </div>
      </form>

      <div className="overflow-x-auto bg-white rounded-2xl border border-cream-muted">
        <table className="w-full text-sm">
          <thead className="bg-cream-muted/50 text-right">
            <tr>
              <th className="p-3">الصنف</th>
              <th className="p-3">التصنيف</th>
              <th className="p-3">السعر</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-cream-muted">
                <td className="p-3 font-bold">{item.name_ar}</td>
                <td className="p-3">{item.category_name}</td>
                <td className="p-3">{item.price}</td>
                <td className="p-3">{item.is_available ? 'متوفر' : 'غير متوفر'}</td>
                <td className="p-3 space-x-reverse space-x-2">
                  <button type="button" onClick={() => startEdit(item)} className="px-2 py-1 rounded bg-cream-muted">تعديل</button>
                  <button type="button" onClick={() => remove(item.id)} className="px-2 py-1 rounded bg-ember/10 text-ember">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        onChange={(e) => onChange(type === 'number' ? e.target.value : e.target.value)}
        className="w-full rounded-xl border border-cream-muted px-3 py-2 bg-white"
      />
    </div>
  )
}
