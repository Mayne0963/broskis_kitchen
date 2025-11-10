import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VendorsPage from '@/app/vendors/page'

// Mock safeFetch to control API responses
vi.mock('@/lib/safeFetch', () => {
  return {
    safeFetch: vi.fn(async (url: string) => {
      if (url.includes('/api/me')) {
        return new Response(null, { status: 401 })
      }
      if (url.includes('/api/my-orders')) {
        return new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(null, { status: 404 })
    })
  }
})

describe('VendorsPage', () => {
  beforeEach(() => {
    // jsdom starts fresh but ensure mocks are clear
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error when profile request returns 401', async () => {
    render(<VendorsPage />)

    // Header is visible, then Profile shows loading
    expect(screen.getByText(/Vendors Dashboard/i)).toBeTruthy()
    expect(screen.getByText(/Loading profile/i)).toBeTruthy()

    // Profile section should display error after fetch
    await waitFor(() => {
      expect(screen.getByText(/Error loading profile/i)).toBeTruthy()
      expect(screen.getByText(/Orders/i)).toBeTruthy()
    })
  })

  it('shows empty orders gracefully when API returns empty list', async () => {
    render(<VendorsPage />)

    await waitFor(() => {
      expect(screen.getByText(/No orders to display/i)).toBeTruthy()
    })
  })
})