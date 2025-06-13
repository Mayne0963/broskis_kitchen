import type React from "react"
import { FaRobot, FaUser } from "react-icons/fa"
import type { ChatMessage as ChatMessageType } from "@/types"

interface ChatMessageProps {
  message: ChatMessageType
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-gold-foil ml-2" : "bg-[#333333] mr-2"
          }`}
        >
          {isUser ? <FaUser className="text-black" /> : <FaRobot className="text-gold-foil" />}
        </div>
        <div className={`rounded-lg px-4 py-2 ${isUser ? "bg-gold-foil text-black" : "bg-[#222222] text-white"}`}>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
