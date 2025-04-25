"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import type { ChatContextType, ChatMessage } from "@/types"

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

    setIsLoading(true)

    try {
      // Add user message to the chat
      const userMessage: ChatMessage = { role: "user", text }
      setMessages((current) => [...current, userMessage])

      // Get response from API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Add assistant response to the chat
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.text || "I'm sorry, I couldn't process your request. Please try again.",
        },
      ])
    } catch (error) {
      console.error("Error sending message:", error)
      // Add a fallback response when the API fails
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I'm having trouble connecting to my services. Please try again later.",
        },
      ])
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
