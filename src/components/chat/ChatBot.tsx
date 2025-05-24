"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { FaRobot, FaTimes, FaPaperPlane, FaTrash } from "react-icons/fa"
import { useChat } from "../../lib/context/ChatContext"
import ChatMessage from "./ChatMessage"
import WelcomeMessage from "./WelcomeMessage"

const ChatBot: React.FC = () => {
  const { messages, sendMessage, isLoading, clearChat } = useChat()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Hide welcome message when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false)
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput("")
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleQuickAction = (message: string) => {
    sendMessage(message)
    setShowWelcome(false)
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? "bg-blood-red rotate-90" : "bg-gold-foil hover:bg-gold-foil/90"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <FaTimes className="text-white text-xl" /> : <FaRobot className="text-black text-xl" />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-36 right-4 z-50 w-80 sm:w-96 bg-[#1A1A1A] rounded-lg shadow-xl border border-[#333333] flex flex-col transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-gold-foil to-blood-red p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center">
            <FaRobot className="text-black mr-2" />
            <h3 className="font-bold text-black">BroskiBot</h3>
          </div>
          <button
            onClick={() => {
              clearChat()
              setShowWelcome(true)
            }}
            className="text-black hover:text-white transition-colors"
            aria-label="Clear chat"
            title="Clear chat history"
          >
            <FaTrash />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "400px" }}>
          {showWelcome && messages.length === 0 ? (
            <WelcomeMessage onQuickActionClick={handleQuickAction} />
          ) : (
            messages.map((message, index) => <ChatMessage key={index} message={message} />)
          )}
          <div ref={messagesEndRef} />

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#333333] mr-2 flex items-center justify-center">
                  <FaRobot className="text-gold-foil" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-[#222222] text-white">
                  <div className="typing-animation">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[#333333] flex">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#222222] border border-[#444444] rounded-l-md px-4 py-2 text-white focus:outline-none focus:border-gold-foil"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`bg-gold-foil text-black px-4 rounded-r-md flex items-center justify-center ${
              isLoading || !input.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-gold-foil/90"
            }`}
            disabled={isLoading || !input.trim()}
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>

      {/* Add CSS for typing animation */}
      <style jsx>{`
        .typing-animation {
          display: flex;
          align-items: center;
          column-gap: 6px;
          padding: 6px 0;
        }
        
        .typing-animation .dot {
          height: 8px;
          width: 8px;
          background-color: #D4AF37;
          border-radius: 50%;
          opacity: 0.7;
          animation: typing 1.5s infinite ease-in-out;
        }
        
        .typing-animation .dot:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing-animation .dot:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .typing-animation .dot:nth-child(3) {
          animation-delay: 0.6s;
        }
        
        @keyframes typing {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </>
  )
}

export default ChatBot
