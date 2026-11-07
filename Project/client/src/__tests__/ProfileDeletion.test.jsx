import { it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import Profile from '../pages/profile/Profile'
import { renderWithRouter } from '../test/testUtils'

const logoutMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Client' }, logout: logoutMock })
}))

it('confirms account deletion, logs out and returns home', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { name: 'Alex', email: 'alex@example.com' } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('confirm', vi.fn(() => true))
  logoutMock.mockClear()

  renderWithRouter(<Profile />, {
    route: '/profile', path: '/profile',
    extraRoutes: [{ path: '/', element: <h1>Home page</h1> }]
  })

  fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))

  expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument()
  expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
  expect(logoutMock).toHaveBeenCalledOnce()
})
