import { it, expect, vi } from 'vitest'
import { apiRequest } from '../services/api'

it('sends cookies and preserves default and caller headers', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) })
  vi.stubGlobal('fetch', fetchMock)

  const result = await apiRequest('/api/test', { method: 'POST', headers: { 'X-Request-Id': 'one' } })

  expect(result).toEqual({ ok: true })
  expect(fetchMock.mock.calls[0][0]).toBe('https://localhost:5000/api/test')
  expect(fetchMock.mock.calls[0][1]).toMatchObject({
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'one' }
  })
})
