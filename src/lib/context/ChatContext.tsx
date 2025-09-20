"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import type { ChatContextType, ChatMessage } from "@/types"
import { safeFetch } from "../utils/safeFetch"

// Create the context with a default undefined value
const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Generate a unique user ID if not already set
  useEffect(() => {
    if (!userId) {
      setUserId(`user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
    }
  }, [userId])

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("chatHistory")
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }, [])

  // Save chat history to localStorage when it changes
  useEffect(() => {
    try {
      // Only save if there are messages
      if (messages.length > 0) {
        localStorage.setItem("chatHistory", JSON.stringify(messages))
      }
    } catch (error) {
      console.error("Failed to save chat history:", error)
    }
  }, [messages])

  // Send a message and get a response
  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await safeFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      let errorText = 'Sorry, I\'m having trouble connecting right now. Please try again later.'
      
      // Provide more specific error messages based on the error
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorText = 'AI services are not properly configured. Please check the setup guide.'
        } else if (error.message.includes('401')) {
          errorText = 'Authentication issues with AI services. Please check the configuration.'
        } else if (error.message.includes('429')) {
          errorText = 'AI services are experiencing high demand. Please try again in a moment.'
        } else if (error.message.includes('500')) {
          errorText = 'AI services are temporarily unavailable. Please try again later.'
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Clear chat history
  const clearChat = () => {
    setMessages([])
    localStorage.removeItem("chatHistory")
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        isLoading,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// Custom hook to use the chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext)

  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }

  return context
}
