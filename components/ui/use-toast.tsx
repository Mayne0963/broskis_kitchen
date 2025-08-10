"use client"

import { useState, useEffect } from "react"

export interface ToastProps {
  message: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
}

export const toast = {
  success: (message: string, duration = 3000) => {
    const event = new CustomEvent("toast", {
      detail: { message, type: "success", duration },
    })
    window.dispatchEvent(event)
  },
  error: (message: string, duration = 3000) => {
    const event = new CustomEvent("toast", {
      detail: { message, type: "error", duration },
    })
    window.dispatchEvent(event)
  },
  warning: (message: string, duration = 3000) => {
    const event = new CustomEvent("toast", {
      detail: { message, type: "warning", duration },
    })
    window.dispatchEvent(event)
  },
  info: (message: string, duration = 3000) => {
    const event = new CustomEvent("toast", {
      detail: { message, type: "info", duration },
    })
    window.dispatchEvent(event)
  },
}

export const useToast = () => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastProps>) => {
      const { message, type, duration } = e.detail
      const id = Date.now().toString()

      setToasts((prev) => [...prev, { id, message, type, duration }])

      if (duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, duration)
      }
    }

    window.addEventListener("toast", handleToast as EventListener)

    return () => {
      window.removeEventListener("toast", handleToast as EventListener)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return { toasts, removeToast }
}

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md text-white flex justify-between items-center min-w-[300px] max-w-md animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-green"
              : toast.type === "error"
                ? "bg-blood-red"
                : toast.type === "warning"
                  ? "bg-amber-500"
                  : "bg-blue-500"
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
