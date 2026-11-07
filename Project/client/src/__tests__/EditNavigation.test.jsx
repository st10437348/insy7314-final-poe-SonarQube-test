import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import AdminEditUser from '../pages/admin/AdminEditUser'
import EditGig from '../pages/gig/EditGig'
import { renderWithRouter } from '../test/testUtils'

const cases = [
  {
    name: 'admin user', Component: AdminEditUser,
    route: '/admin/users/u1/edit', path: '/admin/users/:id/edit', destination: '/admin/users',
    body: { user: { name: 'Alex', email: 'alex@example.com', role: 'Client', isActive: true } }
  },
  {
    name: 'gig', Component: EditGig,
    route: '/gigs/u1/edit', path: '/gigs/:id/edit', destination: '/my-gigs',
    body: { gig: { title: 'Logo', description: 'Logo design', category: 'Design', price: 100, deliveryDays: 2 } }
  }
]

const renderEditor = ({ Component, route, path, destination }) => renderWithRouter(<Component />, {
  route, path,
  extraRoutes: [{ path: destination, element: <h1>List page</h1> }]
})

describe('edit page navigation', () => {
  it.each(cases)('$name returns to its list after saving', async (item) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => item.body })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    renderEditor(item)

    fireEvent.submit((await screen.findByRole('button', { name: 'Save Changes' })).closest('form'))

    expect(await screen.findByRole('heading', { name: 'List page' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT')
  })

  it.each(cases)('$name returns to its list when cancelled', async (item) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => item.body }))
    renderEditor(item)

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(await screen.findByRole('heading', { name: 'List page' })).toBeInTheDocument()
  })
})
