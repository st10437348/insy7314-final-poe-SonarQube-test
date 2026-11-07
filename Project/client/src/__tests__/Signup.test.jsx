import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Signup from '../pages/auth/Signup'
import { mockFetch, renderWithRouter } from '../test/testUtils'

function renderSignup() {
  return renderWithRouter(<Signup />, {
    route: '/signup',
    path: '/signup',
    extraRoutes: [{ path: '/login', element: <h1>Login Page</h1> }]
  })
}

async function fillForm(user, { password = 'SecurePass1!', confirm = password, role = 'Client' } = {}) {
  await user.type(screen.getByLabelText(/first name/i), 'Test')
  await user.type(screen.getByLabelText(/last name/i), 'User')
  await user.type(screen.getByLabelText(/^email/i), 'test.user@hustlehub.test')
  await user.type(screen.getByLabelText(/^password/i), password)
  await user.type(screen.getByLabelText(/confirm password/i), confirm)
  await user.selectOptions(screen.getByLabelText(/account type/i), role)
}

describe('Signup page', () => {
  it('renders all registration fields with Client selected by default', () => {
    renderSignup()
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/account type/i)).toHaveValue('Client')
    expect(screen.getByRole('option', { name: 'Freelancer' })).toBeInTheDocument()
    // Admin must never be selectable from the public signup form.
    expect(screen.queryByRole('option', { name: /admin/i })).not.toBeInTheDocument()
  })

  it('blocks submission and shows an error when the passwords do not match', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    renderSignup()
    await fillForm(user, { password: 'SecurePass1!', confirm: 'Different1!' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the first validation message returned by the API', async () => {
    const user = userEvent.setup()
    mockFetch({
      ok: false,
      status: 400,
      body: {
        message: 'Validation failed.',
        errors: [{ path: 'password', msg: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }]
      }
    })
    renderSignup()
    await fillForm(user, { password: 'weakpassword' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/must contain at least one uppercase letter/i)).toBeInTheDocument()
  })

  it('sends the combined name and selected role, then redirects to login', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch({ status: 201, body: { message: 'User registered successfully' } })
    renderSignup()
    await fillForm(user, { role: 'Freelancer' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({
      name: 'Test User',
      email: 'test.user@hustlehub.test',
      password: 'SecurePass1!',
      role: 'Freelancer'
    })
  })
})
