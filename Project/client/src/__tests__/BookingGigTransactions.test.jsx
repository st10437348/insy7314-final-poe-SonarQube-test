import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import Bookings from '../pages/bookings/Bookings'
import MyGigs from '../pages/gig/MyGigs'
import Transactions from '../pages/transactions/Transactions'
import { renderWithRouter } from '../test/testUtils'

const auth = vi.hoisted(() => ({ role: 'Freelancer' }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { role: auth.role } }) }))
const reply = (body) => ({ ok: true, json: async () => body })

describe('booking, gig and transaction pages', () => {
  it('lets a freelancer accept a pending booking', async () => {
    auth.role = 'Freelancer'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ bookings: [{
        _id: 'b1', status: 'pending', agreedPrice: 500,
        gigId: { _id: 'g1', title: 'Logo Design', category: 'Design' },
        location: { address: 'Pretoria' }
      }] }))
      .mockResolvedValueOnce(reply({ booking: { status: 'accepted' } }))
    vi.stubGlobal('fetch', fetchMock)
    renderWithRouter(<Bookings />, { route: '/bookings', path: '/bookings' })

    expect(await screen.findByRole('heading', { name: 'Logo Design' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(await screen.findByRole('button', { name: 'Start work' })).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: 'accepted' })
  })

  it('lets a client cancel a booking before work begins', async () => {
    auth.role = 'Client'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ bookings: [{ _id: 'b2', status: 'pending', gigId: { _id: 'g2', title: 'Website' } }] }))
      .mockResolvedValueOnce(reply({ booking: { status: 'cancelled' } }))
    vi.stubGlobal('fetch', fetchMock)
    renderWithRouter(<Bookings />, { route: '/bookings', path: '/bookings' })

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument())
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: 'cancelled' })
  })

  it('shows a freelancer gig and removes it after confirmation', async () => {
    auth.role = 'Freelancer'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ gigs: [{
        _id: 'g1', title: 'Logo Design', description: 'Custom logo', category: 'Design',
        price: 500, deliveryDays: 3, status: 'active', averageRating: 4.5
      }] }))
      .mockResolvedValueOnce(reply({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderWithRouter(<MyGigs />, { route: '/my-gigs', path: '/my-gigs' })

    expect(await screen.findByRole('heading', { name: 'Logo Design' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('heading', { name: 'No gigs yet' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
  })

  it('shows freelancer earnings and the transaction details', async () => {
    auth.role = 'Freelancer'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({
      summary: { gross: 1000, fees: 100, tax: 50, net: 850 },
      transactions: [{
        _id: 't1', status: 'completed', amount: 1000, platformFee: 100,
        taxAmount: 50, freelancerAmount: 850,
        bookingId: { status: 'completed', gigId: { title: 'Logo Design' } },
        createdAt: '2026-11-07T12:00:00Z'
      }]
    })))
    renderWithRouter(<Transactions />, { route: '/transactions', path: '/transactions' })

    expect(await screen.findByText('Logo Design')).toBeInTheDocument()
    expect(screen.getByText('Net Income')).toBeInTheDocument()
    expect(screen.getAllByText(/850/).length).toBeGreaterThan(0)
  })

  it('shows a client booking total without freelancer-only columns', async () => {
    auth.role = 'Client'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({
      summary: { gross: 500 },
      transactions: [{ _id: 't2', amount: 500, status: 'completed', bookingTitle: 'Website' }]
    })))
    renderWithRouter(<Transactions />, { route: '/transactions', path: '/transactions' })

    expect(await screen.findByText('Website')).toBeInTheDocument()
    expect(screen.getByText('Completed Booking Total')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Tax' })).not.toBeInTheDocument()
  })
})
