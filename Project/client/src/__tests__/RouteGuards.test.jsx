import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../routes/ProtectedRoute'
import RoleRoute from '../routes/RoleRoutes'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

// Mirrors the structure used in App.jsx: ProtectedRoute -> RoleRoute -> page.
function renderGuarded(route, allowedRoles) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/login" element={<h1>Login Page</h1>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={allowedRoles} />}>
            <Route path="/secret" element={<h1>Secret Page</h1>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Route guards (frontend RBAC)', () => {
  it('shows a loading message while the session is being restored', () => {
    useAuth.mockReturnValue({ user: null, loading: true })
    renderGuarded('/secret', ['Freelancer'])
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects a logged-out visitor to the login page', () => {
    useAuth.mockReturnValue({ user: null, loading: false })
    renderGuarded('/secret', ['Freelancer'])
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Secret Page')).not.toBeInTheDocument()
  })

  it('redirects a Client away from a Freelancer-only page', () => {
    useAuth.mockReturnValue({ user: { role: 'Client' }, loading: false })
    renderGuarded('/secret', ['Freelancer'])
    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Secret Page')).not.toBeInTheDocument()
  })

  it('redirects a Freelancer away from an Admin-only page', () => {
    useAuth.mockReturnValue({ user: { role: 'Freelancer' }, loading: false })
    renderGuarded('/secret', ['Admin'])
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('lets a user with the correct role see the page', () => {
    useAuth.mockReturnValue({ user: { role: 'Freelancer' }, loading: false })
    renderGuarded('/secret', ['Freelancer'])
    expect(screen.getByText('Secret Page')).toBeInTheDocument()
  })
})
