import { supabase, PUBLIC_SITE_URL } from '../lib/supabase'

function mapItem(row) {
  if (!row) return row
  return {
    ...row,
    image: row.image_url || row.image || null,
    price: row.price != null ? String(row.price) : row.price,
  }
}

function mapCat(row) {
  if (!row) return row
  return {
    ...row,
    image: row.image_url || row.image || null,
    items: Array.isArray(row.menu_items) ? row.menu_items.map(mapItem) : row.items,
  }
}

function mapAd(row) {
  if (!row) return row
  const now = Date.now()
  const startOk = !row.start_at || new Date(row.start_at).getTime() <= now
  const endOk = !row.end_at || new Date(row.end_at).getTime() >= now
  return {
    ...row,
    image: row.image_url || row.image || null,
    is_currently_visible: Boolean(row.is_active && startOk && endOk),
  }
}

function mapSettings(row) {
  if (!row) return row
  return {
    ...row,
    logo: row.logo_url || null,
    hero_image: row.hero_image_url || null,
    about_image: row.about_image_url || null,
    public_site_url: row.public_site_url || PUBLIC_SITE_URL,
  }
}

export async function login(email, password) {
  // Support username "admin" by mapping to configured admin email
  const emailOrUser = email.includes('@') ? email : `${email}@baladi.local`
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailOrUser,
    password,
  })
  if (error) {
    // try raw email if mapping failed
    const retry = await supabase.auth.signInWithPassword({ email, password })
    if (retry.error) throw Object.assign(new Error(retry.error.message), { response: { data: { detail: retry.error.message } } })
    return retry.data
  }
  return data
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function isLoggedIn() {
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session)
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Axios-like thin API used by existing pages */
const api = {
  async get(path) {
    const [resource, query = ''] = path.replace(/^\//, '').split('?')
    const params = new URLSearchParams(query)

    if (resource === 'settings/' || resource === 'settings') {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
      if (error) throw error
      return { data: mapSettings(data) }
    }

    if (resource === 'admin/settings/' || resource === 'admin/settings') {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
      if (error) throw error
      return { data: mapSettings(data) }
    }

    if (resource === 'admin/stats/' || resource === 'admin/stats') {
      const [cats, items, ads] = await Promise.all([
        supabase.from('categories').select('id,is_active'),
        supabase.from('menu_items').select('id,is_available'),
        supabase.from('advertisements').select('id,is_active'),
      ])
      return {
        data: {
          categories: cats.data?.length || 0,
          active_categories: cats.data?.filter((c) => c.is_active).length || 0,
          menu_items: items.data?.length || 0,
          available_items: items.data?.filter((i) => i.is_available).length || 0,
          advertisements: ads.data?.length || 0,
          active_advertisements: ads.data?.filter((a) => a.is_active).length || 0,
          tables: 0,
          active_tables: 0,
        },
      }
    }

    if (resource.startsWith('categories')) {
      const includeItems = params.get('include_items') === '1'
      let q = supabase.from('categories').select(includeItems ? '*, menu_items(*)' : '*').order('sort_order')
      const { data, error } = await q
      if (error) throw error
      const rows = (data || []).map((c) => {
        const mapped = mapCat(c)
        if (includeItems && Array.isArray(c.menu_items)) {
          mapped.items = c.menu_items
            .slice()
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(mapItem)
          mapped.items_count = mapped.items.length
        } else {
          mapped.items_count = mapped.items_count ?? 0
        }
        return mapped
      })
      // attach counts when not including items
      if (!includeItems) {
        const { data: counts } = await supabase.from('menu_items').select('category_id')
        const map = {}
        ;(counts || []).forEach((r) => {
          map[r.category_id] = (map[r.category_id] || 0) + 1
        })
        rows.forEach((r) => {
          r.items_count = map[r.id] || 0
        })
      }
      return { data: rows }
    }

    if (resource.startsWith('menu-items')) {
      const { data, error } = await supabase.from('menu_items').select('*, categories(name_ar)').order('sort_order')
      if (error) throw error
      return {
        data: (data || []).map((row) => ({
          ...mapItem(row),
          category: row.category_id,
          category_name: row.categories?.name_ar,
        })),
      }
    }

    if (resource.startsWith('advertisements')) {
      const placement = params.get('placement')
      let q = supabase.from('advertisements').select('*').order('sort_order')
      if (placement) q = q.eq('placement', placement)
      const { data, error } = await q
      if (error) throw error
      let rows = (data || []).map(mapAd)
      if (params.get('preview') !== '1') {
        rows = rows.filter((a) => a.is_currently_visible)
      }
      return { data: rows }
    }

    if (resource === 'tables/menu_url/' || resource === 'tables/menu_url') {
      const { data } = await supabase.from('site_settings').select('public_site_url').eq('id', 1).single()
      const base = (data?.public_site_url || PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')
      return { data: { menu_url: `${base}/menu` } }
    }

    throw new Error(`Unknown GET ${path}`)
  },

  async post(path, body) {
    const resource = path.replace(/^\//, '').replace(/\/$/, '')
    body = await hydrateUploads(body)

    if (resource === 'auth/login') {
      return { data: await login(body.username || body.email, body.password) }
    }

    if (resource === 'categories') {
      const payload = normalizeCat(body)
      const { data, error } = await supabase.from('categories').insert(payload).select().single()
      if (error) throw wrapError(error)
      return { data: mapCat(data) }
    }

    if (resource === 'menu-items') {
      const payload = normalizeItem(body)
      const { data, error } = await supabase.from('menu_items').insert(payload).select().single()
      if (error) throw wrapError(error)
      return { data: mapItem(data) }
    }

    if (resource === 'advertisements') {
      const payload = normalizeAd(body)
      const { data, error } = await supabase.from('advertisements').insert(payload).select().single()
      if (error) throw wrapError(error)
      return { data: mapAd(data) }
    }

    throw new Error(`Unknown POST ${path}`)
  },

  async patch(path, body) {
    const clean = path.replace(/^\//, '').replace(/\/$/, '')
    body = await hydrateUploads(body)

    if (clean === 'admin/settings') {
      const payload = normalizeSettings(body)
      const { data, error } = await supabase.from('site_settings').update(payload).eq('id', 1).select().single()
      if (error) throw wrapError(error)
      return { data: mapSettings(data) }
    }

    if (clean.startsWith('categories/')) {
      const id = Number(clean.split('/')[1])
      const payload = normalizeCat(body)
      const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
      if (error) throw wrapError(error)
      return { data: mapCat(data) }
    }

    if (clean.startsWith('menu-items/')) {
      const id = Number(clean.split('/')[1])
      const payload = normalizeItem(body)
      const { data, error } = await supabase.from('menu_items').update(payload).eq('id', id).select().single()
      if (error) throw wrapError(error)
      return { data: mapItem(data) }
    }

    if (clean.startsWith('advertisements/')) {
      const id = Number(clean.split('/')[1])
      const payload = normalizeAd(body)
      const { data, error } = await supabase.from('advertisements').update(payload).eq('id', id).select().single()
      if (error) throw wrapError(error)
      return { data: mapAd(data) }
    }

    throw new Error(`Unknown PATCH ${path}`)
  },

  async delete(path) {
    const clean = path.replace(/^\//, '').replace(/\/$/, '')
    const [table, id] = clean.split('/')
    const tableMap = {
      categories: 'categories',
      'menu-items': 'menu_items',
      advertisements: 'advertisements',
    }
    const db = tableMap[table]
    if (!db) throw new Error(`Unknown DELETE ${path}`)
    const { error } = await supabase.from(db).delete().eq('id', Number(id))
    if (error) throw error
    return { data: null }
  },
}

function wrapError(error) {
  return Object.assign(new Error(error.message || 'Request failed'), {
    response: { data: error },
  })
}

async function hydrateUploads(body) {
  if (!(body instanceof FormData)) return body
  const obj = {}
  const files = {}
  body.forEach((v, k) => {
    if (v instanceof File) files[k] = v
    else obj[k] = v
  })
  for (const [key, file] of Object.entries(files)) {
    if (!file || !file.size) continue
    const folder = key.includes('logo') || key.includes('hero') || key.includes('about') ? 'brand' : key.includes('ad') ? 'ads' : 'menu'
    const url = await uploadImage(file, folder)
    if (key === 'image') obj.image_url = url
    else if (key.endsWith('_url') || key.includes('image') || key.includes('logo') || key.includes('hero') || key.includes('about')) {
      obj[`${key.replace(/_file$/, '')}_url`.replace('__', '_')] = url
      if (key === 'logo') obj.logo_url = url
      if (key === 'hero_image') obj.hero_image_url = url
      if (key === 'about_image') obj.about_image_url = url
    } else {
      obj.image_url = url
    }
  }
  return obj
}

function fromFormData(body) {
  if (body instanceof FormData) {
    const obj = {}
    body.forEach((v, k) => {
      if (v instanceof File) return
      obj[k] = v
    })
    return obj
  }
  return { ...body }
}

function normalizeCat(body) {
  const b = fromFormData(body)
  return {
    name_ar: b.name_ar,
    description_ar: b.description_ar || '',
    image_url: b.image_url || b.image || '',
    sort_order: Number(b.sort_order || 0),
    is_active: b.is_active === true || b.is_active === 'true' || b.is_active === 'on' || b.is_active === '1',
  }
}

function normalizeItem(body) {
  const b = fromFormData(body)
  return {
    category_id: Number(b.category || b.category_id),
    name_ar: b.name_ar,
    description_ar: b.description_ar || '',
    price: Number(b.price || 0),
    image_url: b.image_url || '',
    is_popular: truthy(b.is_popular),
    is_recommended: truthy(b.is_recommended),
    is_available: b.is_available === undefined ? true : truthy(b.is_available),
    sort_order: Number(b.sort_order || 0),
  }
}

function normalizeAd(body) {
  const b = fromFormData(body)
  return {
    title_ar: b.title_ar,
    description_ar: b.description_ar || '',
    image_url: b.image_url || '',
    promo_price: b.promo_price === '' || b.promo_price == null ? null : Number(b.promo_price),
    discount_percent: b.discount_percent === '' || b.discount_percent == null ? null : Number(b.discount_percent),
    cta_text: b.cta_text || 'استكشف المنيو',
    cta_link: b.cta_link || '/menu',
    placement: b.placement || 'offers',
    start_at: b.start_at || null,
    end_at: b.end_at || null,
    is_active: truthy(b.is_active ?? true),
    sort_order: Number(b.sort_order || 0),
  }
}

function normalizeSettings(body) {
  const b = fromFormData(body)
  const out = {}
  const fields = [
    'restaurant_name', 'restaurant_name_en', 'tagline', 'description',
    'hero_headline', 'hero_subtext', 'logo_url', 'hero_image_url', 'about_image_url',
    'phone', 'address', 'maps_embed_url', 'maps_link', 'facebook_url', 'instagram_url',
    'public_site_url',
  ]
  fields.forEach((f) => {
    if (b[f] !== undefined) out[f] = b[f]
  })
  if (b.working_hours) {
    out.working_hours = typeof b.working_hours === 'string' ? JSON.parse(b.working_hours) : b.working_hours
  }
  return out
}

function truthy(v) {
  return v === true || v === 'true' || v === 'on' || v === '1' || v === 1
}

export async function uploadImage(file, folder = 'menu') {
  if (!file) return ''
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return data.publicUrl
}

export default api
