import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, isLoggedIn } from '../../api/client'
import { useEffect } from 'react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) navigate('/admin', { replace: true })
  }, [navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen texture-warm grid place-items-center px-4" dir="rtl">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-cream rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-extrabold text-ink">بلدي بلدي</div>
          <p className="text-smoke text-sm mt-1">دخول لوحة التحكم</p>
        </div>
        {error && <div className="mb-4 text-sm text-ember bg-ember/10 rounded-xl px-3 py-2">{String(error)}</div>}
        <label className="block text-sm mb-1 font-bold">اسم المستخدم</label>
        <input
          className="w-full mb-4 rounded-xl border border-cream-muted px-4 py-3 bg-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <label className="block text-sm mb-1 font-bold">كلمة المرور</label>
        <input
          type="password"
          className="w-full mb-6 rounded-xl border border-cream-muted px-4 py-3 bg-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-cream font-bold py-3 rounded-xl hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  )
}
