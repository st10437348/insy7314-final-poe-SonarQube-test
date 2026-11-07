import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../test/testUtils'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminApiUsage from '../pages/admin/AdminApiUsage'
import AdminBookings from '../pages/admin/AdminBookings'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminEditUser from '../pages/admin/AdminEditUser'
import AdminGigs from '../pages/admin/AdminGigs'
import AdminUsers from '../pages/admin/AdminUsers'
import Bookings from '../pages/bookings/Bookings'
import Dashboard from '../pages/dashboard/Dashboard'
import EditGig from '../pages/gig/EditGig'
import GigDetails from '../pages/gig/GigDetails'
import MyGigs from '../pages/gig/MyGigs'
import Profile from '../pages/profile/Profile'
import Transactions from '../pages/transactions/Transactions'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Freelancer', _id: 'u1' }, logout: vi.fn() })
}))

const cases = [
  ['analytics', AdminAnalytics, '/admin/analytics', '/admin/analytics', '/api/admin/analytics', 'Service unavailable'],
  ['API usage', AdminApiUsage, '/admin/api-usage', '/admin/api-usage', '/api/admin/api-usage', 'Service unavailable'],
  ['admin bookings', AdminBookings, '/admin/bookings', '/admin/bookings', '/api/admin/bookings', 'Service unavailable'],
  ['admin dashboard', AdminDashboard, '/admin', '/admin', '/api/admin/', 'Service unavailable'],
  ['admin edit user', AdminEditUser, '/admin/users/u1/edit', '/admin/users/:id/edit', '/api/admin/users/u1', 'Service unavailable'],
  ['admin gigs', AdminGigs, '/admin/gigs', '/admin/gigs', '/api/admin/gigs', 'Service unavailable'],
  ['admin users', AdminUsers, '/admin/users', '/admin/users', '/api/admin/users', 'Service unavailable'],
  ['bookings', Bookings, '/bookings', '/bookings', '/api/bookings/my-bookings', 'Failed to load bookings.'],
  ['dashboard', Dashboard, '/dashboard', '/dashboard', '/api/income', 'Failed to load dashboard data.'],
  ['edit gig', EditGig, '/gigs/u1/edit', '/gigs/:id/edit', '/api/gigs/my-gigs/u1', 'Service unavailable'],
  ['gig details', GigDetails, '/gigs/u1', '/gigs/:id', '/api/gigs/u1', 'Failed to load gig.'],
  ['my gigs', MyGigs, '/my-gigs', '/my-gigs', '/api/gigs/my-gigs', 'Service unavailable'],
  ['profile', Profile, '/profile', '/profile', '/api/users/profile', 'Service unavailable'],
  ['transactions', Transactions, '/transactions', '/transactions', '/api/transactions/my-transactions', 'Service unavailable']
]

describe('page loaders handle unavailable API responses', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it.each(cases)('%s shows its API error', async (_name, Component, route, path, endpoint, message) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: 'Service unavailable' })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRouter(<Component />, { route, path })

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes(endpoint))).toBe(true)
  })
})
