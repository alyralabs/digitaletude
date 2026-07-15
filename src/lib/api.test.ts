import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './api'

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
