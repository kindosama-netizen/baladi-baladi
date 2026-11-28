/**
 * Seed Firestore using the web client SDK + admin login.
 * Usage (from repo root):
 *   node firebase/seed-client.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore'

const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(here, 'seed.json'), 'utf8'))

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAPMcJZU-hJPX28hADXf25Jr3C-hhnWJWw',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'baladi-restaurant-4ed4a.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'baladi-restaurant-4ed4a',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'baladi-restaurant-4ed4a.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '926023628656',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:926023628656:web:e3b8f5d22666dd0d6841b5',
})

const auth = getAuth(app)
const db = getFirestore(app)

const email = process.env.BALADI_ADMIN_EMAIL || 'admin@baladi-restaurant.app'
const password = process.env.BALADI_ADMIN_PASSWORD || 'Bb!xZO8#BnWh@*id0'

await signInWithEmailAndPassword(auth, email, password)
console.log('Signed in as', email)

async function writeCollection(name, docs) {
  const entries = Object.entries(docs || {})
  for (let i = 0; i < entries.length; i += 400) {
    const chunk = entries.slice(i, i + 400)
    const batch = writeBatch(db)
    for (const [id, data] of chunk) {
      batch.set(doc(db, name, id), data, { merge: true })
    }
    await batch.commit()
    console.log(`Wrote ${chunk.length} docs to ${name}`)
  }
}

await writeCollection('site_settings', seed.site_settings)
await writeCollection('categories', seed.categories)
await writeCollection('menu_items', seed.menu_items)
await writeCollection('advertisements', seed.advertisements)
console.log('Seed complete.')
process.exit(0)
