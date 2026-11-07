import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

const auth = vi.hoisted(() => ({ user: null }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: auth.user, loading: false, logout: vi.fn() })
}))

it('shows the guest home page with navigation and footer', () => {
  auth.user = null
  render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Find Work. Hire Talent. Grow.' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Browse Gigs' })).toHaveAttribute('href', '/marketplace')
  expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
})

it('shows the freelancer home actions and a controlled unknown route', () => {
  auth.user = { role: 'Freelancer', name: 'Alex' }
  const { unmount } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Build your freelance business.' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'Create a Gig' })[0]).toHaveAttribute('href', '/create-gig')
  unmount()

  render(<MemoryRouter initialEntries={['/does-not-exist']}><App /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'NotFound' })).toBeInTheDocument()
})
