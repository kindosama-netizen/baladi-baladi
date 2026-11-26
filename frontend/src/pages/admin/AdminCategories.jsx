import { useEffect, useState } from 'react'
import api from '../../api/client'
import ImageField from '../../components/admin/ImageField'

const empty = { name_ar: '', description_ar: '', sort_order: 0, is_active: true }

export default function AdminCategories() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState(null)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => api.get('/categories/').then((r) => setItems(r.data))
  useEffect(() => { load() }, [])

  async function save(e) {
    e.preventDefault()
    setMsg('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v === true || v === false ? String(v) : v))
    if (image) fd.append('image', image)
    try {
      if (editing) await api.patch(`/categories/${editing}/`, fd)
      else await api.post('/categories/', fd)
      setForm(empty)
      setImage(null)
      setEditing(null)
      setMsg('تم الحفظ')
      load()
    } catch (err) {
      setMsg(err.response?.data ? JSON.stringify(err.response.data) : 'خطأ')
    }
  }

  async function remove(id) {
    if (!confirm('حذف التصنيف؟')) return
    await api.delete(`/categories/${id}/`)
    load()
  }

  function startEdit(cat) {
    setEditing(cat.id)
    setForm({
      name_ar: cat.name_ar,
      description_ar: cat.description_ar || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    })
    setImage(null)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold mb-6">التصنيفات</h1>
      {msg && <p className="mb-4 text-sm text-ember">{msg}</p>}
      <form onSubmit={save} className="bg-white rounded-2xl border border-cream-muted p-5 mb-8 grid md:grid-cols-2 gap-4">
        <Field label="الاسم بالعربي" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} required />
        <Field label="الترتيب" type="number" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
        <div className="md:col-span-2">
          <Field label="الوصف" value={form.description_ar} onChange={(v) => setForm({ ...form, description_ar: v })} />
        </div>
        <ImageField label="صورة التصنيف" file={image} onFile={setImage} />
        <label className="flex items-center gap-2 text-sm font-bold self-end pb-2">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          نشط
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-ink text-cream px-5 py-2.5 rounded-xl font-bold">{editing ? 'تحديث' : 'إضافة'}</button>
          {editing && (
            <button type="button" className="px-4 py-2.5 rounded-xl border" onClick={() => { setEditing(null); setForm(empty); setImage(null) }}>
              إلغاء
            </button>
          )}
        </div>
      </form>
      <div className="space-y-2">
        {items.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-cream-muted px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {cat.image && <img src={cat.image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
              <div>
                <div className="font-bold">{cat.name_ar}</div>
                <div className="text-xs text-smoke">ترتيب {cat.sort_order} · {cat.is_active ? 'نشط' : 'متوقف'} · {cat.items_count ?? 0} أصناف</div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => startEdit(cat)} className="text-sm px-3 py-1.5 rounded-lg bg-cream-muted">تعديل</button>
              <button type="button" onClick={() => remove(cat.id)} className="text-sm px-3 py-1.5 rounded-lg bg-ember/10 text-ember">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full rounded-xl border border-cream-muted px-3 py-2 bg-white"
      />
    </div>
  )
}
