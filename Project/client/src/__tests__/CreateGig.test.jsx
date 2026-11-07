import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import CreateGig from '../pages/gig/CreateGig'
import { renderWithRouter } from '../test/testUtils'

const renderForm = () => renderWithRouter(<CreateGig />, {
  route: '/gigs/new',
  path: '/gigs/new',
  extraRoutes: [
    { path: '/gigs/:id', element: <h1>Created gig</h1> },
    { path: '/my-gigs', element: <h1>My gigs page</h1> },
    { path: '/dashboard', element: <h1>Dashboard page</h1> }
  ]
})

const fillForm = () => {
  fireEvent.change(screen.getByLabelText('Gig Title'), { target: { value: 'Logo design' } })
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A custom logo for your business' } })
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Design' } })
  fireEvent.change(screen.getByLabelText('Price (R)'), { target: { value: '125.50' } })
  fireEvent.change(screen.getByLabelText('Delivery Time (days)'), { target: { value: '3' } })
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Pretoria' } })
}

describe('Create gig numeric validation', () => {
  it('submits parsed numbers and opens the created gig', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ gig: { _id: 'gig1' } }) })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: 'Create Gig' }).closest('form'))

    expect(await screen.findByRole('heading', { name: 'Created gig' })).toBeInTheDocument()
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload.price).toBe(125.5)
    expect(payload.deliveryDays).toBe(3)
  })

  it('rejects an invalid price before making an API request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderForm()
    fillForm()
    fireEvent.change(screen.getByLabelText('Price (R)'), { target: { value: '' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create Gig' }).closest('form'))

    expect(await screen.findByText('Please enter a valid price.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid delivery time before making an API request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderForm()
    fillForm()
    fireEvent.change(screen.getByLabelText('Delivery Time (days)'), { target: { value: '0' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create Gig' }).closest('form'))

    expect(await screen.findByText('Delivery days must be at least 1.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('opens the gig list when the API does not return a gig ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ gig: {} }) }))
    renderForm()
    fillForm()
    fireEvent.submit(screen.getByRole('button', { name: 'Create Gig' }).closest('form'))

    expect(await screen.findByRole('heading', { name: 'My gigs page' })).toBeInTheDocument()
  })

  it('returns to the dashboard when cancelled', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByRole('heading', { name: 'Dashboard page' })).toBeInTheDocument()
  })
})
