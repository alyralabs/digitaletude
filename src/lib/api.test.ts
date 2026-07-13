import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, adminFetch } from './api'

vi.mock('./supabase', () => ({
  supabaseClient: vi.fn(),
}))

import { supabaseClient } from './supabase'

describe('apiFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns parsed JSON on a 200 response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ hello: 'world' }), { status: 200 }),
    )
    const result = await apiFetch<{ hello: string }>('/api/x')
    expect(result).toEqual({ hello: 'world' })
  })

  it('returns undefined on a 204 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const result = await apiFetch('/api/x', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ApiError with the server message on a non-OK JSON response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'not found' } }), {
        status: 404,
        statusText: 'Not Found',
      }),
    )
    await expect(apiFetch('/api/x')).rejects.toMatchObject({
      status: 404,
      message: 'not found',
    })
  })

  it('falls back to statusText on a non-OK non-JSON response', async () => {
    fetchMock.mockResolvedValue(
      new Response('plain text body', {
        status: 500,
        statusText: 'Server Error',
      }),
    )
    await expect(apiFetch('/api/x')).rejects.toMatchObject({
      status: 500,
      message: 'Server Error',
    })
  })
})

describe('adminFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('attaches the bearer token from the current session', async () => {
    vi.mocked(supabaseClient).mockReturnValue({
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: { access_token: 'tok123' } } }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await adminFetch('/api/admin/x')

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer tok123')
  })

  it('omits the Authorization header when there is no session', async () => {
    vi.mocked(supabaseClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await adminFetch('/api/admin/x')

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBeNull()
  })
})
