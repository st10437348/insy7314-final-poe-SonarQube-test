import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'

// Builds a fake fetch Response so components can be tested without the real API.
export function mockResponse(body, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body)
  })
}

// Replaces the global fetch with a mock that returns the given responses in order.
export function mockFetch(...responses) {
  const fn = vi.fn()
  responses.forEach((r) => fn.mockImplementationOnce(() => mockResponse(r.body, r.ok ?? true, r.status)))
  vi.stubGlobal('fetch', fn)
  return fn
}

// Renders a component inside a router, plus simple marker pages to detect redirects.
export function renderWithRouter(ui, { route = '/', path = '/', extraRoutes = [] } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
        {extraRoutes.map(({ path: p, element }) => (
          <Route key={p} path={p} element={element} />
        ))}
      </Routes>
    </MemoryRouter>
  )
}
