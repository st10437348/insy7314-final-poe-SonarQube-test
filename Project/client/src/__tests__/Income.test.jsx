import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Income from '../pages/transactions/Income'
import { mockFetch, renderWithRouter } from '../test/testUtils'

describe('Income page', () => {
  it('shows the tax-year totals, monthly chart and calculation explanation', async () => {
    mockFetch({ body: { income: {
      period: { taxYear: 2027 },
      summary: { gross: 120000, fees: 12000, taxable: 108000, tax: 1620, net: 106380, recordedTax: 0 },
      monthlyIncome: [{ month: 'Oct 2026', amount: 108000 }],
      taxMethod: {
        ratesYear: 2027, primaryRebate: 17820,
        source: 'https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/',
        note: 'Indicative estimate only.'
      }
    } } })
    renderWithRouter(<Income />, { route: '/income', path: '/income' })
    expect(await screen.findByRole('heading', { name: 'Income and tax' })).toBeInTheDocument()
    expect(screen.getByText(/2027 tax year/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Monthly earnings chart' })).toBeInTheDocument()
    expect(screen.getByText('Oct 2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View SARS tax rates and rebates' })).toHaveAttribute('href', expect.stringContaining('sars.gov.za'))
  })
})
