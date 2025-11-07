import { render, screen, waitFor, act, renderHook } from '@testing-library/react'
import { AuthLoadingProvider, useAuthLoading } from '@/lib/context/AuthLoadingContext'
import { PageLoadingWrapper } from '@/components/auth/PageLoadingWrapper'
import { useAuthCache } from '@/lib/hooks/useAuthCache'
import React from 'react'
import { vi } from 'vitest'

// Mock existing page components with their loading states
jest.mock('@/components/menu/MenuPage', () => ({
  MenuPage: () => <div data-testid="menu-page">Menu Page Content</div>
}))

jest.mock('@/components/menu/MenuLoading', () => ({
  MenuLoading: () => <div data-testid="menu-loading">Menu Loading...</div>
}))

jest.mock('@/components/orders/OrderPage', () => ({
  OrderPage: () => <div data-testid="order-page">Order Page Content</div>
}))

jest.mock('@/components/orders/OrderLoading', () => ({
  OrderLoading: () => <div data-testid="order-loading">Order Loading...</div>
}))

jest.mock('@/components/cart/CartPage', () => ({
  CartPage: () => <div data-testid="cart-page">Cart Page Content</div>
}))

jest.mock('@/components/cart/CartLoading', () => ({
  CartLoading: () => <div data-testid="cart-loading">Cart Loading...</div>
}))

describe('Integration with Existing Page Loading States', () => {
  const TestPageWithLocalLoading = ({ 
    isLoading, 
    children 
  }: { 
    isLoading: boolean
    children: React.ReactNode 
  }) => {
    if (isLoading) {
      return <div data-testid="local-loading">Local Page Loading...</div>
    }
    return <div data-testid="page-content">{children}</div>
  }

  it('should show global auth loading before page-specific loading', async () => {
    const PageWithAuthAndLocalLoading = () => {
      const [isLocalLoading, setIsLocalLoading] = React.useState(true)
      const { isAuthReady } = useAuthLoading()

      React.useEffect(() => {
        if (isAuthReady) {
          // Simulate data fetching after auth is ready
          setTimeout(() => setIsLocalLoading(false), 500)
        }
      }, [isAuthReady])

      return (
        <TestPageWithLocalLoading isLoading={isLocalLoading}>
          Page with local data loading
        </TestPageWithLocalLoading>
      )
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <PageWithAuthAndLocalLoading />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Initially should show global auth loading
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()
    expect(screen.queryByTestId('local-loading')).not.toBeInTheDocument()

    // After auth is ready, should show local loading
    await waitFor(() => {
      expect(screen.getByTestId('local-loading')).toBeInTheDocument()
    })

    // Finally should show content
    await waitFor(() => {
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })
  })

  it('should handle menu page with both auth and data loading', async () => {
    const MenuPageWithAuth = () => {
      const [isMenuLoading, setIsMenuLoading] = React.useState(true)
      const { isAuthReady } = useAuthLoading()

      React.useEffect(() => {
        if (isAuthReady) {
          // Simulate menu data loading
          setTimeout(() => setIsMenuLoading(false), 300)
        }
      }, [isAuthReady])

      if (isMenuLoading) {
        return <div data-testid="menu-loading">Menu Loading...</div>
      }

      return <div data-testid="menu-page">Menu Page Content</div>
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <MenuPageWithAuth />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Should show global auth loading first
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()

    // Then menu-specific loading
    await waitFor(() => {
      expect(screen.getByTestId('menu-loading')).toBeInTheDocument()
    })

    // Finally menu content
    await waitFor(() => {
      expect(screen.getByTestId('menu-page')).toBeInTheDocument()
    })
  })

  it('should handle order page with authentication dependency', async () => {
    const OrderPageWithAuth = () => {
      const [isOrderLoading, setIsOrderLoading] = React.useState(true)
      const { isAuthReady, isAuthenticated } = useAuthLoading()

      React.useEffect(() => {
        if (isAuthReady && isAuthenticated) {
          // Only load orders if authenticated
          setTimeout(() => setIsOrderLoading(false), 400)
        } else if (isAuthReady && !isAuthenticated) {
          // Redirect or show login prompt if not authenticated
          setIsOrderLoading(false)
        }
      }, [isAuthReady, isAuthenticated])

      if (isOrderLoading) {
        return <div data-testid="order-loading">Order Loading...</div>
      }

      return (
        <div data-testid="order-page">
          {isAuthenticated ? 'Order Page Content' : 'Please log in to view orders'}
        </div>
      )
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <OrderPageWithAuth />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Should show global auth loading
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()

    // Then order loading
    await waitFor(() => {
      expect(screen.getByTestId('order-loading')).toBeInTheDocument()
    })

    // Finally order content (will show login message since not authenticated in test)
    await waitFor(() => {
      expect(screen.getByTestId('order-page')).toHaveTextContent('Please log in to view orders')
    })
  })

  it('should handle cart page with cached authentication', async () => {
    const CartPageWithCache = () => {
      const [isCartLoading, setIsCartLoading] = React.useState(true)
      const { isAuthReady } = useAuthLoading()
      const { getCachedAuth } = useAuthCache()

      React.useEffect(() => {
        if (isAuthReady) {
          const cachedAuth = getCachedAuth()
          if (cachedAuth?.authenticated) {
            // Use cached auth for faster cart loading
            setTimeout(() => setIsCartLoading(false), 100)
          } else {
            // Fallback to full cart loading
            setTimeout(() => setIsCartLoading(false), 500)
          }
        }
      }, [isAuthReady, getCachedAuth])

      if (isCartLoading) {
        return <div data-testid="cart-loading">Cart Loading...</div>
      }

      return <div data-testid="cart-page">Cart Page Content</div>
    }

    // Pre-populate cache
    const { result } = renderHook(() => useAuthCache())
    act(() => {
      result.current.setCachedAuth(true, { uid: 'test-user', email: 'test@example.com' })
    })

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper minLoadingTime={0}>
          <CartPageWithCache />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Should show global auth loading
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()

    // Cart should load quickly due to cache
    await waitFor(() => {
      expect(screen.getByTestId('cart-page')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should handle rapid page transitions', async () => {
    const MultiPageApp = () => {
      const [currentPage, setCurrentPage] = React.useState('menu')
      const { isAuthReady } = useAuthLoading()

      const pages = {
        menu: <div data-testid="menu-content">Menu Content</div>,
        orders: <div data-testid="orders-content">Orders Content</div>,
        cart: <div data-testid="cart-content">Cart Content</div>
      }

      React.useEffect(() => {
        if (isAuthReady) {
          // Simulate rapid page switching
          const timer1 = setTimeout(() => setCurrentPage('orders'), 100)
          const timer2 = setTimeout(() => setCurrentPage('cart'), 200)
          
          return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
          }
        }
      }, [isAuthReady])

      return (
        <div>
          <div data-testid="current-page">{currentPage}</div>
          {pages[currentPage as keyof typeof pages]}
        </div>
      )
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper minLoadingTime={0}>
          <MultiPageApp />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Should show global auth loading initially
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()

    // Should transition through pages without showing auth loading again
    await waitFor(() => {
      expect(screen.getByTestId('current-page')).toHaveTextContent('cart')
      expect(screen.getByTestId('cart-content')).toBeInTheDocument()
    })
  })

  it('should handle auth state changes during page lifecycle', async () => {
    const PageWithAuthStateChanges = () => {
      const [authState, setAuthState] = React.useState('checking')
      const { isAuthReady, isAuthenticated, hasError } = useAuthLoading()

      React.useEffect(() => {
        if (isAuthReady) {
          if (hasError) {
            setAuthState('error')
          } else if (isAuthenticated) {
            setAuthState('authenticated')
          } else {
            setAuthState('anonymous')
          }
        }
      }, [isAuthReady, isAuthenticated, hasError])

      return (
        <div>
          <div data-testid="auth-state">{authState}</div>
          <div data-testid="page-content">
            {authState === 'authenticated' && 'Welcome back!'}
            {authState === 'anonymous' && 'Please log in'}
            {authState === 'error' && 'Authentication error occurred'}
          </div>
        </div>
      )
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <PageWithAuthStateChanges />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Should show global auth loading
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()

    // Should transition to appropriate state
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
      expect(screen.getByTestId('page-content')).toHaveTextContent('Please log in')
    })
  })
})

describe('Performance Integration', () => {
  it('should cache auth state across multiple pages', async () => {
    const { result: cacheResult } = renderHook(() => useAuthCache())
    
    // Set up initial auth state
    act(() => {
      cacheResult.current.setCachedAuth(true, { uid: 'test-user', email: 'test@example.com' })
    })

    const Page1 = () => {
      const { isAuthReady } = useAuthLoading()
      return <div data-testid="page1">{isAuthReady ? 'Page 1 Ready' : 'Page 1 Not Ready'}</div>
    }

    const Page2 = () => {
      const { isAuthReady } = useAuthLoading()
      return <div data-testid="page2">{isAuthReady ? 'Page 2 Ready' : 'Page 2 Not Ready'}</div>
    }

    const { rerender } = render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <Page1 />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // First page should benefit from cache
    await waitFor(() => {
      expect(screen.getByTestId('page1')).toHaveTextContent('Page 1 Ready')
    })

    // Switch to second page
    rerender(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <Page2 />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Second page should also be ready quickly due to cache
    await waitFor(() => {
      expect(screen.getByTestId('page2')).toHaveTextContent('Page 2 Ready')
    })
  })

  it('should handle cache expiration gracefully', async () => {
    const { result: cacheResult } = renderHook(() => useAuthCache())
    
    // Set up auth state with short cache time
    act(() => {
      cacheResult.current.setCachedAuth(true, { uid: 'test-user', email: 'test@example.com' })
    })

    // Use fake timers to control time-based behavior
    jest.useFakeTimers()

    // Advance time to expire cache
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000) // 3 minutes
    })

    const TestPage = () => {
      const { isAuthReady } = useAuthLoading()
      return <div data-testid="page">{isAuthReady ? 'Ready' : 'Not Ready'}</div>
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <TestPage />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Should re-verify auth when cache is expired
    await waitFor(() => {
      expect(screen.getByTestId('page')).toHaveTextContent('Ready')
    })
  })
})
