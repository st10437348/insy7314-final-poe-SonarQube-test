import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import AdminApiUsage from '../pages/admin/AdminApiUsage'
import AdminBookings from '../pages/admin/AdminBookings'
import AdminGigs from '../pages/admin/AdminGigs'
import AdminUsers from '../pages/admin/AdminUsers'
import { renderWithRouter } from '../test/testUtils'

const reply = (body) => ({ ok: true, json: async () => body })

describe('admin management pages', () => {
  it('summarizes API traffic and filters by method and month', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply({ usage: [
      { date: '2026-11-07T12:00:00Z', endpoint: '/api/gigs', method: 'GET', requests: 3, successful: 2, failed: 1 },
      { date: '2026-12-01T12:00:00Z', endpoint: '/api/users', method: 'POST', requests: 2, successful: 2, failed: 0 }
    ] }))
    vi.stubGlobal('fetch', fetchMock)
    const { container } = renderWithRouter(<AdminApiUsage />, { route: '/admin/api-usage', path: '/admin/api-usage' })

    expect(await screen.findByText('/api/gigs')).toBeInTheDocument()
    expect(within(screen.getAllByText('Total Requests')[0].closest('.stat-card')).getByText('5')).toBeInTheDocument()
    expect(container.querySelectorAll('.chart-point-total')).toHaveLength(2)

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'POST' } })
    expect(screen.queryByText('/api/gigs')).not.toBeInTheDocument()
    expect(screen.getByText('/api/users')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
    fireEvent.change(screen.getByLabelText('Filter By'), { target: { value: 'month' } })
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-11' } })
    expect(screen.getByText('/api/gigs')).toBeInTheDocument()
    expect(screen.queryByText('/api/users')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.chart-point-total')).toHaveLength(1)
  })

  it('pauses and deletes a gig after confirmation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ gigs: [{ _id: 'g1', title: 'Logo Design', category: 'Design', price: 100, status: 'active', freelancerId: { name: 'Alex' } }] }))
      .mockResolvedValueOnce(reply({ gig: { status: 'paused' } }))
      .mockResolvedValueOnce(reply({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderWithRouter(<AdminGigs />, { route: '/admin/gigs', path: '/admin/gigs' })

    const row = (await screen.findByText('Logo Design')).closest('tr')
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'paused' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: 'paused' })
    fireEvent.click(within(row).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByText('Logo Design')).not.toBeInTheDocument())
    expect(fetchMock.mock.calls[2][1].method).toBe('DELETE')
  })

  it('disables and removes a user after confirmation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ users: [{ _id: 'u1', name: 'Alex', email: 'alex@example.com', role: 'Client', isActive: true }] }))
      .mockResolvedValueOnce(reply({ user: { isActive: false } }))
      .mockResolvedValueOnce(reply({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderWithRouter(<AdminUsers />, { route: '/admin/users', path: '/admin/users' })

    const row = (await screen.findByText('alex@example.com')).closest('tr')
    fireEvent.click(within(row).getByRole('button', { name: 'Disable' }))
    expect(await within(row).findByRole('button', { name: 'Enable' })).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ isActive: false })
    fireEvent.click(within(row).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByText('alex@example.com')).not.toBeInTheDocument())
    expect(fetchMock.mock.calls[2][1].method).toBe('DELETE')
  })

  it('changes a booking status and sends the chosen value to the API', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ bookings: [{ _id: 'b1', status: 'pending', gigId: { title: 'Logo Design', price: 100 }, clientId: { name: 'Client' }, freelancerId: { name: 'Alex' } }] }))
      .mockResolvedValueOnce(reply({ booking: { status: 'completed' } }))
    vi.stubGlobal('fetch', fetchMock)
    renderWithRouter(<AdminBookings />, { route: '/admin/bookings', path: '/admin/bookings' })

    const row = (await screen.findByText('Logo Design')).closest('tr')
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: 'completed' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: 'completed' })
  })
})
