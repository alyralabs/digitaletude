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
