import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, PUBLIC_SITE_URL, storage } from '../lib/firebase'

const SETTINGS_ID = 'main'

function serializeTime(v) {
  if (!v) return v
  if (typeof v === 'string') return v
  if (v?.toDate) return v.toDate().toISOString()
  return v
}

function mapRow(row) {
  if (!row) return row
  const out = { ...row, id: row.id }
  if (out.start_at) out.start_at = serializeTime(out.start_at)
  if (out.end_at) out.end_at = serializeTime(out.end_at)
  if (out.created_at) out.created_at = serializeTime(out.created_at)
  if (out.updated_at) out.updated_at = serializeTime(out.updated_at)
  return out
}

function mapItem(row) {
  if (!row) return row
  return {
    ...mapRow(row),
    image: row.image_url || row.image || null,
    price: row.price != null ? String(row.price) : row.price,
  }
}

function mapCat(row) {
  if (!row) return row
  return {
    ...mapRow(row),
    image: row.image_url || row.image || null,
    items: Array.isArray(row.menu_items) ? row.menu_items.map(mapItem) : row.items,
  }
}

function mapAd(row) {
  if (!row) return row
  const now = Date.now()
  const startOk = !row.start_at || new Date(serializeTime(row.start_at)).getTime() <= now
  const endOk = !row.end_at || new Date(serializeTime(row.end_at)).getTime() >= now
  return {
    ...mapRow(row),
    image: row.image_url || row.image || null,
    is_currently_visible: Boolean(row.is_active && startOk && endOk),
  }
}

function mapSettings(row) {
  if (!row) return row
  return {
    ...mapRow(row),
    logo: row.logo_url || null,
    hero_image: row.hero_image_url || null,
    about_image: row.about_image_url || null,
    public_site_url: row.public_site_url || PUBLIC_SITE_URL,
  }
}

function authThrow(error) {
  const message = error?.message || 'Request failed'
  throw Object.assign(new Error(message), {
    response: { data: { detail: message } },
  })
}

async function getSettingsDoc() {
  const snap = await getDoc(doc(db, 'site_settings', SETTINGS_ID))
  if (!snap.exists()) return null
  return mapSettings({ id: snap.id, ...snap.data() })
}

async function fetchCollection(name) {
  const snap = await getDocs(collection(db, name))
  return snap.docs.map((d) => mapRow({ id: d.id, ...d.data() }))
}

function sortByOrder(rows) {
  return rows.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

export async function login(email, password) {
  const emailOrUser = email.includes('@') ? email : `${email}@baladi-restaurant.app`
  try {
    const cred = await signInWithEmailAndPassword(auth, emailOrUser, password)
    return { user: cred.user, session: { user: cred.user } }
  } catch (first) {
    if (emailOrUser !== email) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        return { user: cred.user, session: { user: cred.user } }
      } catch (retry) {
        authThrow(retry)
      }
    }
    authThrow(first)
  }
}

export async function logout() {
  await signOut(auth)
}

export async function isLoggedIn() {
  await auth.authStateReady()
  return Boolean(auth.currentUser)
}

export async function getSession() {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) return null
  const token = await user.getIdToken()
  return { user, access_token: token }
}

/** Axios-like thin API used by existing pages */
const api = {
  async get(path) {
    const [resource, query = ''] = path.replace(/^\//, '').split('?')
    const params = new URLSearchParams(query)

    if (resource === 'settings/' || resource === 'settings') {
      const data = await getSettingsDoc()
      if (!data) throw new Error('Site settings not found')
      return { data }
    }

    if (resource === 'admin/settings/' || resource === 'admin/settings') {
      const data = await getSettingsDoc()
      if (!data) throw new Error('Site settings not found')
      return { data }
    }

    if (resource === 'admin/stats/' || resource === 'admin/stats') {
      const [cats, items, ads] = await Promise.all([
        fetchCollection('categories'),
        fetchCollection('menu_items'),
        fetchCollection('advertisements'),
      ])
      return {
        data: {
          categories: cats.length,
          active_categories: cats.filter((c) => c.is_active).length,
          menu_items: items.length,
          available_items: items.filter((i) => i.is_available).length,
          advertisements: ads.length,
          active_advertisements: ads.filter((a) => a.is_active).length,
          tables: 0,
          active_tables: 0,
        },
      }
    }

    if (resource.startsWith('categories')) {
      const includeItems = params.get('include_items') === '1'
      const [catRows, itemRows] = await Promise.all([
        fetchCollection('categories'),
        includeItems || !params.get('include_items') ? fetchCollection('menu_items') : Promise.resolve([]),
      ])
      let rows = sortByOrder(catRows).map(mapCat)
      if (includeItems) {
        const byCat = {}
        sortByOrder(itemRows).forEach((item) => {
          const cid = item.category_id
          if (!byCat[cid]) byCat[cid] = []
          byCat[cid].push(mapItem(item))
        })
        rows = rows.map((c) => ({
          ...c,
          items: byCat[c.id] || [],
          items_count: (byCat[c.id] || []).length,
        }))
      } else {
        const map = {}
        itemRows.forEach((r) => {
          map[r.category_id] = (map[r.category_id] || 0) + 1
        })
        rows.forEach((r) => {
          r.items_count = map[r.id] || 0
        })
      }
      return { data: rows }
    }

    if (resource.startsWith('menu-items')) {
      const [itemRows, catRows] = await Promise.all([
        fetchCollection('menu_items'),
        fetchCollection('categories'),
      ])
      const names = Object.fromEntries(catRows.map((c) => [c.id, c.name_ar]))
      return {
        data: sortByOrder(itemRows).map((row) => ({
          ...mapItem(row),
          category: row.category_id,
          category_name: names[row.category_id],
        })),
      }
    }

    if (resource.startsWith('advertisements')) {
      let rows = sortByOrder(await fetchCollection('advertisements')).map(mapAd)
      const placement = params.get('placement')
      if (placement) rows = rows.filter((a) => a.placement === placement)
      if (params.get('preview') !== '1') {
        rows = rows.filter((a) => a.is_currently_visible)
      }
      return { data: rows }
    }

    if (resource === 'tables/menu_url/' || resource === 'tables/menu_url') {
      const settings = await getSettingsDoc()
      const base = (settings?.public_site_url || PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')
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
      const payload = withTimestamps(normalizeCat(body), true)
      const refCol = await addDoc(collection(db, 'categories'), payload)
      const snap = await getDoc(refCol)
      return { data: mapCat({ id: snap.id, ...snap.data() }) }
    }

    if (resource === 'menu-items') {
      const payload = withTimestamps(normalizeItem(body), true)
      const refCol = await addDoc(collection(db, 'menu_items'), payload)
      const snap = await getDoc(refCol)
      return { data: mapItem({ id: snap.id, ...snap.data() }) }
    }

    if (resource === 'advertisements') {
      const payload = withTimestamps(normalizeAd(body), true)
      const refCol = await addDoc(collection(db, 'advertisements'), payload)
      const snap = await getDoc(refCol)
      return { data: mapAd({ id: snap.id, ...snap.data() }) }
    }

    throw new Error(`Unknown POST ${path}`)
  },

  async patch(path, body) {
    const clean = path.replace(/^\//, '').replace(/\/$/, '')
    body = await hydrateUploads(body)

    if (clean === 'admin/settings') {
      const payload = withTimestamps(normalizeSettings(body), false)
      const refDoc = doc(db, 'site_settings', SETTINGS_ID)
      await setDoc(refDoc, payload, { merge: true })
      const snap = await getDoc(refDoc)
      return { data: mapSettings({ id: snap.id, ...snap.data() }) }
    }

    if (clean.startsWith('categories/')) {
      const id = clean.split('/')[1]
      const payload = withTimestamps(normalizeCat(body), false)
      const refDoc = doc(db, 'categories', id)
      await updateDoc(refDoc, payload)
      const snap = await getDoc(refDoc)
      return { data: mapCat({ id: snap.id, ...snap.data() }) }
    }

    if (clean.startsWith('menu-items/')) {
      const id = clean.split('/')[1]
      const payload = withTimestamps(normalizeItem(body), false)
      const refDoc = doc(db, 'menu_items', id)
      await updateDoc(refDoc, payload)
      const snap = await getDoc(refDoc)
      return { data: mapItem({ id: snap.id, ...snap.data() }) }
    }

    if (clean.startsWith('advertisements/')) {
      const id = clean.split('/')[1]
      const payload = withTimestamps(normalizeAd(body), false)
      const refDoc = doc(db, 'advertisements', id)
      await updateDoc(refDoc, payload)
      const snap = await getDoc(refDoc)
      return { data: mapAd({ id: snap.id, ...snap.data() }) }
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
    const coll = tableMap[table]
    if (!coll) throw new Error(`Unknown DELETE ${path}`)
    await deleteDoc(doc(db, coll, id))
    return { data: null }
  },
}

function withTimestamps(payload, isCreate) {
  const out = { ...payload }
  out.updated_at = serverTimestamp()
  if (isCreate) out.created_at = serverTimestamp()
  return out
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
    category_id: String(b.category ?? b.category_id ?? ''),
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
  const path = `media/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type || undefined })
  return getDownloadURL(storageRef)
}

export default api