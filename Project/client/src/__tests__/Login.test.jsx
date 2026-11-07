import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../pages/auth/Login'
import { mockFetch, renderWithRouter } from '../test/testUtils'

// Mock the auth context so we can check that login() is called with the user.
const loginMock = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: loginMock })
}))

const marker = (text) => <h1>{text}</h1>

function renderLogin() {
  return renderWithRouter(<Login />, {
    route: '/login',
    path: '/login',
    extraRoutes: [
      { path: '/dashboard', element: marker('Freelancer Dashboard Page') },
      { path: '/admin', element: marker('Admin Page') },
      { path: '/', element: marker('Home Page') }
    ]
  })
}

describe('Login page', () => {
  beforeEach(() => loginMock.mockClear())

  it('renders the email, password fields and login button', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('updates the inputs as the user types', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'client@hustlehub.test')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    expect(screen.getByLabelText(/email/i)).toHaveValue('client@hustlehub.test')
    expect(screen.getByLabelText(/password/i)).toHaveValue('Password123!')
  })

  it('shows a safe error message when the credentials are wrong', async () => {
    const user = userEvent.setup()
    mockFetch({ ok: false, status: 401, body: { message: 'Invalid email or password.' } })
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'wrong@hustlehub.test')
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1!')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('sends credentials with cookies included and redirects a freelancer to the dashboard', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch({
      body: { message: 'Login successful', user: { id: '1', name: 'John', role: 'Freelancer' } }
    })
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'john@hustlehub.test')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText('Freelancer Dashboard Page')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://localhost:5000/api/auth/login')
    expect(options.method).toBe('POST')
    expect(options.credentials).toBe('include')
    expect(JSON.parse(options.body)).toEqual({ email: 'john@hustlehub.test', password: 'Password123!' })
    expect(loginMock).toHaveBeenCalledWith({ id: '1', name: 'John', role: 'Freelancer' })
  })

  it('redirects an admin to the admin dashboard', async () => {
    const user = userEvent.setup()
    mockFetch({ body: { user: { id: '9', name: 'Admin', role: 'Admin' } } })
    renderLogin()
    await user.type(screen.getByLabelText(/email/i), 'admin@hustlehub.test')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(await screen.findByText('Admin Page')).toBeInTheDocument()
  })
})
