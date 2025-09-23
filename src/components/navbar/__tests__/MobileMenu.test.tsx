import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import MobileMenu from '../MobileMenu'
import { useAuth } from '@/lib/context/AuthContext'
import { useCart } from '@/lib/context/CartContext'
import { useAuthClaims } from '@/hooks/useAuthClaims'
import { MAIN_LINKS } from '@/components/nav/links'

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: function MockLink({ children, href, ...props }: any) {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    }
  }
})

// Mock React Portal
vi.mock('react-dom', () => ({
  createPortal: (children: any) => children,
}))

// Mock Auth Context
vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock Cart Context
vi.mock('@/lib/context/CartContext', () => ({
  useCart: vi.fn(),
}))

// Mock useAuthClaims hook
vi.mock('@/hooks/useAuthClaims', () => ({
  useAuthClaims: vi.fn()
}))

const mockUseAuth = vi.mocked(useAuth)
const mockUseCart = vi.mocked(useCart)
const mockUseAuthClaims = vi.mocked(useAuthClaims)

// Helper function to render with mocked hooks
const renderWithMocks = (props: any, authMock?: any, cartMock?: any, claimsMock?: any) => {
  mockUseAuth.mockReturnValue(authMock || {
    user: null,
    currentUser: null,
    claims: {},
    isLoading: false,
    loading: false,
    isAuthenticated: false,
    isAdmin: false,
    login: vi.fn(),
    signup: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    signInWithGoogle: vi.fn(),
    resendEmailVerification: vi.fn(),
    sendVerificationEmail: vi.fn(),
    refreshUserToken: vi.fn(),
  })

  mockUseCart.mockReturnValue(cartMock || {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  })

  mockUseAuthClaims.mockReturnValue(claimsMock || { claims: null })

  return render(<MobileMenu {...props} />)
}

describe('MobileMenu', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  describe('when user is not authenticated', () => {
    it('renders all navigation items', () => {
      renderWithMocks({
        open: true,
        onOpenChange: vi.fn()
      })
      
      // Check that navigation links are present within the nav element
      const navElement = screen.getByRole('navigation')
      MAIN_LINKS.forEach(item => {
        const linkElement = screen.getByRole('link', { name: item.label })
        expect(linkElement).toBeInTheDocument()
        expect(linkElement.getAttribute('href')).toBe(item.href)
      })
    })

    it('shows Sign In / Join CTA button', () => {
      renderWithMocks({
        open: true,
        onOpenChange: vi.fn()
      })
      
      expect(screen.getByText('Sign In / Join')).toBeInTheDocument()
    })

    it('shows Cart button', () => {
      renderWithMocks({
        open: true,
        onOpenChange: vi.fn()
      })
      
      expect(screen.getByText('Cart')).toBeInTheDocument()
    })

    it('displays cart badge when cart has items', () => {
      renderWithMocks(
        {
          open: true,
          onOpenChange: vi.fn()
        },
        undefined,
        { itemCount: 2 }
      )
      
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should not render authenticated user buttons', () => {
      renderWithMocks({
        open: true,
        onOpenChange: vi.fn()
      })
      
      expect(screen.queryByText('My Account')).not.toBeInTheDocument()
      expect(screen.queryByText('Order History')).not.toBeInTheDocument()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
      expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    })
  })

  describe('when user is authenticated but not admin', () => {
    it('shows authenticated user buttons but not admin', () => {
      const mockUser = {
        id: '1',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'customer' as const,
        emailVerified: true
      }
      
      renderWithMocks(
        {
          open: true,
          onOpenChange: vi.fn()
        },
        {
          user: mockUser,
          isAuthenticated: true,
          isAdmin: false
        }
      )
      
      expect(screen.getByText('My Account')).toBeInTheDocument()
      expect(screen.getByText('Order History')).toBeInTheDocument()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign In / Join')).not.toBeInTheDocument()
    })
  })

  describe('when user is authenticated and admin', () => {
    it('renders Account, Order History, Admin, Cart buttons', () => {
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin' as const,
        emailVerified: true
      }
      
      renderWithMocks(
        {
          open: true,
          onOpenChange: vi.fn()
        },
        {
          user: mockUser,
          isAuthenticated: true,
          isAdmin: true
        },
        undefined,
        { claims: { admin: true } }
      )
      
      expect(screen.getByText('My Account')).toBeInTheDocument()
      expect(screen.getByText('Order History')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Cart')).toBeInTheDocument()
    })

    it('does not show Sign In / Join button when authenticated', () => {
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin' as const,
        emailVerified: true
      }
      
      renderWithMocks(
        {
          open: true,
          onOpenChange: vi.fn()
        },
        {
          user: mockUser,
          isAuthenticated: true,
          isAdmin: true
        },
        undefined,
        { claims: { admin: true } }
      )
      
      expect(screen.queryByText('Sign In / Join')).not.toBeInTheDocument()
    })
  })

  describe('menu behavior', () => {
    it('should call onOpenChange when close button is clicked', () => {
      const onOpenChangeMock = vi.fn()
      renderWithMocks({
        open: true,
        onOpenChange: onOpenChangeMock
      })
      
      const closeButton = screen.getByLabelText('Close menu')
      fireEvent.click(closeButton)
      
      expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    })

    it('should call onOpenChange when backdrop is clicked', () => {
      const onOpenChangeMock = vi.fn()
      renderWithMocks({
        open: true,
        onOpenChange: onOpenChangeMock
      })
      
      // Find the backdrop div by data-testid
      const backdrop = screen.getByTestId('mobile-menu-backdrop')
      fireEvent.click(backdrop)
      
      expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    })
  })

  describe('scroll lock functionality', () => {
    it('locks body scroll when menu opens', () => {
      const onCloseMock = vi.fn()
      renderWithMocks({
        open: true,
        onOpenChange: onCloseMock
      })
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('unlocks body scroll when menu closes', () => {
      const onCloseMock = vi.fn()
      const { rerender } = renderWithMocks({
        open: true,
        onOpenChange: onCloseMock
      })
      
      rerender(<MobileMenu open={false} onOpenChange={onCloseMock} />)
      
      expect(document.body.style.overflow).toBe('')
    })

    it('closes menu when ESC key is pressed', async () => {
      const onCloseMock = vi.fn()
      renderWithMocks({
        open: true,
        onOpenChange: onCloseMock
      })
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalledWith(false)
      })
    })
  })
})