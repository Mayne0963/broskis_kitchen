"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAll = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false)

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/30'
      case 'error':
        return 'bg-red-900/90 border-red-500/30'
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/30'
      case 'info':
        return 'bg-blue-900/90 border-blue-500/30'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`p-4 rounded-lg border backdrop-blur-sm ${getColors()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm text-gray-300 mt-1">{toast.message}</p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium text-[#FFD700] hover:text-[#FFD700]/80 mt-2 underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && !isHovered && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'success', title, message, action })
  }
}

export function useErrorToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'error', title, message, action, duration: 7000 })
  }
}

export function useWarningToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'warning', title, message, action })
  }
}

export function useInfoToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'info', title, message, action })
  }
}

// Pre-built toast messages for common scenarios
export function useCommonToasts() {
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()
  const warningToast = useWarningToast()
  const infoToast = useInfoToast()

  return {
    // Success messages
    itemAdded: (itemName: string) => successToast('Added to cart', `${itemName} has been added to your cart`),
    itemRemoved: (itemName: string) => successToast('Removed from cart', `${itemName} has been removed from your cart`),
    orderPlaced: () => successToast('Order placed!', 'Your order has been successfully placed'),
    paymentSuccess: () => successToast('Payment successful', 'Your payment has been processed'),
    profileUpdated: () => successToast('Profile updated', 'Your profile has been successfully updated'),
    
    // Error messages
    networkError: () => errorToast('Connection error', 'Please check your internet connection and try again'),
    paymentFailed: () => errorToast('Payment failed', 'There was an issue processing your payment'),
    orderFailed: () => errorToast('Order failed', 'Unable to place your order. Please try again'),
    loginFailed: () => errorToast('Login failed', 'Invalid email or password'),
    serverError: () => errorToast('Server error', 'Something went wrong on our end. Please try again later'),
    
    // Warning messages
    cartEmpty: () => warningToast('Cart is empty', 'Add some items to your cart before checkout'),
    sessionExpiring: () => warningToast('Session expiring', 'Your session will expire soon. Please save your work'),
    unsavedChanges: () => warningToast('Unsaved changes', 'You have unsaved changes that will be lost'),
    
    // Info messages
    loading: () => infoToast('Loading...', 'Please wait while we process your request'),
    maintenance: () => infoToast('Maintenance mode', 'Some features may be temporarily unavailable'),
    newFeature: (feature: string) => infoToast('New feature!', `Check out our new ${feature} feature`)
  }
}