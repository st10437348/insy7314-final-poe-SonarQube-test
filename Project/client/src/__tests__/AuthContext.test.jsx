import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

function SessionStatus() {
  const { user, loading } = useAuth()
  return <div>{loading ? 'Restoring session' : user?.name || 'Signed out'}</div>
}

it('restores the signed-in user from the session endpoint', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ user: { name: 'Alex', role: 'Freelancer' } })
  })
  vi.stubGlobal('fetch', fetchMock)

  render(<AuthProvider><SessionStatus /></AuthProvider>)

  expect(screen.getByText('Restoring session')).toBeInTheDocument()
  expect(await screen.findByText('Alex')).toBeInTheDocument()
  expect(fetchMock.mock.calls[0][0]).toContain('/api/auth/me')
})
