/**
 * Import firebase/seed.json into Firestore (requires Firebase CLI + service account).
 *
 *   npm i -g firebase-tools
 *   firebase login
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   node firebase/seed.mjs --project YOUR_PROJECT_ID
 *
 * Or paste documents from seed.json manually in the Firebase console.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(join(here, 'seed.json'), 'utf8'))

const projectId = process.argv.includes('--project')
  ? process.argv[process.argv.indexOf('--project') + 1]
  : process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT

if (!getApps().length) {
  initializeApp(projectId ? { projectId } : undefined)
}

const db = getFirestore()
const batch = db.batch()
let n = 0

for (const [id, data] of Object.entries(seed.site_settings || {})) {
  batch.set(db.collection('site_settings').doc(id), data, { merge: true })
  n += 1
}
for (const [id, data] of Object.entries(seed.categories || {})) {
  batch.set(db.collection('categories').doc(id), data, { merge: true })
  n += 1
}
for (const [id, data] of Object.entries(seed.menu_items || {})) {
  batch.set(db.collection('menu_items').doc(id), data, { merge: true })
  n += 1
}
for (const [id, data] of Object.entries(seed.advertisements || {})) {
  batch.set(db.collection('advertisements').doc(id), data, { merge: true })
  n += 1
}

if (n > 500) {
  console.error('Too many writes for one batch; split seed import.')
  process.exit(1)
}

await batch.commit()
console.log(`Imported ${n} documents into Firestore.`)