import { supabaseClient } from './supabase'

// Empty in dev (Vite proxies /api to the Go server); the API origin in prod.
export const API = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function throwFromResponse(res: Response): Promise<never> {
  let message = res.statusText
  try {
    const body = await res.json()
    message = body?.error?.message ?? message
  } catch {
    // non-JSON body; keep statusText
  }
  throw new ApiError(res.status, message)
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API}${path}`, init)
  if (!res.ok) await throwFromResponse(res)
  if (res.status === 204) return undefined as T
  return res.json()
}

// adminFetch attaches the Supabase session token. All admin calls go through
// here so the header and error handling live in one place.
export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { data } = await supabaseClient().auth.getSession()
  const token = data.session?.access_token
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return apiFetch<T>(path, { ...init, headers })
}
