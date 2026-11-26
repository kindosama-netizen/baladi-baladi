import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/client'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { SettingsContext } from '../context/SettingsContext'

export default function PublicLayout() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    api.get('/settings/').then((r) => setSettings(r.data)).catch(() => setSettings({}))
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      <div className="min-h-screen flex flex-col bg-cream text-ink">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </SettingsContext.Provider>
  )
}
