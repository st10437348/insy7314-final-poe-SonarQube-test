import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

const renderNavbar = () => render(<MemoryRouter><Navbar /></MemoryRouter>)

describe('Navbar', () => {
  it('shows Login and Sign Up links to visitors', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() })
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
  })

  it('shows freelancer links (My Gigs, Income) only to freelancers', () => {
    useAuth.mockReturnValue({ user: { role: 'Freelancer' }, logout: vi.fn() })
    renderNavbar()
    expect(screen.getByRole('link', { name: 'My Gigs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Income' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('hides freelancer and admin links from clients', () => {
    useAuth.mockReturnValue({ user: { role: 'Client' }, logout: vi.fn() })
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Bookings' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Gigs' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Income' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('shows admin links only to admins', () => {
    useAuth.mockReturnValue({ user: { role: 'Admin' }, logout: vi.fn() })
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument()
  })

  it('calls logout when the Logout button is clicked', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()
    useAuth.mockReturnValue({ user: { role: 'Client' }, logout })
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /logout/i }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
