import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AdminPagination from '../components/dashboard/AdminPagination'

describe('admin list pagination', () => {
  it('shows the current range and moves between pages', () => {
    const onPageChange = vi.fn()
    render(<AdminPagination currentPage={2} totalItems={95} rowsPerPage={10} onPageChange={onPageChange} />)

    expect(screen.getByText('Showing 11 - 20 of 95 records')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    expect(onPageChange.mock.calls).toEqual([[1], [3], [4]])
  })

  it('clamps a typed page number and rejects a fractional page', () => {
    const onPageChange = vi.fn()
    render(<AdminPagination currentPage={2} totalItems={95} rowsPerPage={10} onPageChange={onPageChange} />)
    const input = screen.getByLabelText('Go to:')

    fireEvent.change(input, { target: { value: '999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onPageChange).toHaveBeenLastCalledWith(10)

    fireEvent.change(input, { target: { value: '-2' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onPageChange).toHaveBeenLastCalledWith(1)

    onPageChange.mockClear()
    fireEvent.change(input, { target: { value: '2.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onPageChange).not.toHaveBeenCalled()
    expect(input).toHaveValue(2)
  })

  it('hides pagination when the list fits on one page', () => {
    const { container } = render(
      <AdminPagination currentPage={1} totalItems={7} rowsPerPage={10} onPageChange={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
