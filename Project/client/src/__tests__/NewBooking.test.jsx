import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewBooking from '../pages/bookings/NewBooking'
import { mockFetch, renderWithRouter } from '../test/testUtils'

const gig = {
  _id: '665f1c2e8b3a4d0012345678',
  title: 'Logo Design',
  description: 'Modern brand logos',
  price: 500,
  status: 'active',
  isActive: true,
  location: { address: 'Cape Town' }
}

function renderBooking(route = `/bookings/new?gigId=${gig._id}`) {
  return renderWithRouter(<NewBooking />, {
    route,
    path: '/bookings/new',
    extraRoutes: [{ path: '/bookings', element: <h1>My Bookings Page</h1> }]
  })
}

describe('New booking page', () => {
  it('asks the user to pick a gig when no gigId is given', () => {
    renderBooking('/bookings/new')
    expect(screen.getByRole('link', { name: /marketplace/i })).toHaveAttribute('href', '/marketplace')
  })

  it('loads the gig and shows the price that will be charged', async () => {
    mockFetch({ body: { gig } })
    renderBooking()
    expect(await screen.findByRole('heading', { name: 'Logo Design' })).toBeInTheDocument()
    expect(screen.getByText('Agreed price: R500.00')).toBeInTheDocument()
    expect(screen.getByText('Location: Cape Town')).toBeInTheDocument()
  })

  it('confirms a booking and sends only gigId and date (never the price)', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(
      { body: { gig } },
      { status: 201, body: { success: true, booking: {}, transaction: {} } }
    )
    renderBooking()
    await screen.findByRole('heading', { name: 'Logo Design' })

    const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    await user.type(screen.getByLabelText(/preferred booking date/i), date)
    await user.click(screen.getByRole('button', { name: /confirm booking/i }))

    expect(await screen.findByText('My Bookings Page')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('https://localhost:5000/api/bookings')
    expect(options.credentials).toBe('include')
    expect(JSON.parse(options.body)).toEqual({ gigId: gig._id, bookingDate: date })
  })

  it('shows the API error when booking is rejected (e.g. rate limited)', async () => {
    const user = userEvent.setup()
    mockFetch(
      { body: { gig } },
      { ok: false, status: 429, body: { message: 'Booking limit reached. Try again later.' } }
    )
    renderBooking()
    await screen.findByRole('heading', { name: 'Logo Design' })
    const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    await user.type(screen.getByLabelText(/preferred booking date/i), date)
    await user.click(screen.getByRole('button', { name: /confirm booking/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Booking limit reached. Try again later.')
  })
})
