import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Marketplace from '../pages/marketplace/Marketplace'
import { mockFetch, renderWithRouter } from '../test/testUtils'

const gigs = [
  { _id: 'g1', title: 'Logo Design', description: 'Modern brand logos', category: 'Design', price: 500, deliveryDays: 3 },
  { _id: 'g2', title: 'React Website', description: 'Responsive web app', category: 'Development', price: 2500, deliveryDays: 10 },
  // A script tag in data must be shown as plain text, never executed (React escapes it).
  { _id: 'g3', title: '<script>alert(1)</script>', description: 'Escaping test', category: 'Writing', price: 100, deliveryDays: 1 }
]

const renderMarketplace = () => renderWithRouter(<Marketplace />, { route: '/marketplace', path: '/marketplace' })

describe('Marketplace page', () => {
  it('shows a loading message, then renders gigs returned by the API', async () => {
    mockFetch({ body: { success: true, count: 3, gigs } })
    renderMarketplace()
    expect(screen.getByText(/loading gigs/i)).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Logo Design' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'React Website' })).toBeInTheDocument()
    expect(screen.getByText('From R500')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /view gig/i })[0]).toHaveAttribute('href', '/gigs/g1')
  })

  it('renders malicious text safely as plain text', async () => {
    mockFetch({ body: { gigs } })
    renderMarketplace()
    const heading = await screen.findByRole('heading', { name: '<script>alert(1)</script>' })
    expect(heading.querySelector('script')).toBeNull()
  })

  it('filters gigs when the user types in the search box', async () => {
    const user = userEvent.setup()
    mockFetch({ body: { gigs } })
    renderMarketplace()
    await screen.findByRole('heading', { name: 'Logo Design' })

    await user.type(screen.getByLabelText(/search/i), 'react')
    expect(screen.getByRole('heading', { name: 'React Website' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Logo Design' })).not.toBeInTheDocument()
  })

  it('filters gigs by category', async () => {
    const user = userEvent.setup()
    mockFetch({ body: { gigs } })
    renderMarketplace()
    await screen.findByRole('heading', { name: 'Logo Design' })

    await user.selectOptions(screen.getByLabelText(/category/i), 'Design')
    expect(screen.getByRole('heading', { name: 'Logo Design' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'React Website' })).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    mockFetch({ body: { gigs } })
    renderMarketplace()
    await screen.findByRole('heading', { name: 'Logo Design' })
    await user.type(screen.getByLabelText(/search/i), 'zzz-no-match')
    expect(screen.getByRole('heading', { name: /no gigs found/i })).toBeInTheDocument()
  })

  it('shows a friendly error when the API fails', async () => {
    mockFetch({ ok: false, status: 500, body: { message: 'An unexpected server error occurred.' } })
    renderMarketplace()
    expect(await screen.findByText('Failed to load gigs.')).toBeInTheDocument()
  })
})
