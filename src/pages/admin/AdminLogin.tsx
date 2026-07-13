import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { InputText } from '@/components/ui/inputtext'
import { Label } from '@/components/ui/label'
import { supabaseClient } from '../../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabaseClient().auth.signInWithPassword({
      email,
      password,
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/admin/photos')
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-16">
      <h1 className="text-2xl font-bold text-color">Admin login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <InputText
            id="email"
            type="email"
            required
            className="w-full"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <InputText
            id="password"
            type="password"
            required
            className="w-full"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
