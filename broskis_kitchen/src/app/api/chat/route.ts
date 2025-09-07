import { NextResponse } from "next/server"
import { generateChatResponse } from "../../../lib/services/openai-chat"
import { indexAllContent } from "../../../lib/utils/contentIndexer"

// Ensure content is indexed before handling requests
let isIndexed = false

export async function POST(request: Request) {
  try {
    // Index content if not already indexed
    if (!isIndexed) {
      await indexAllContent()
      isIndexed = true
    }

    const { messages, userId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    // Get the last user message
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop()?.text || ""

    // Generate response using OpenAI
    const responseText = await generateChatResponse(messages, lastUserMessage)

    return NextResponse.json({
      role: "assistant",
      text: responseText,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({
      role: "assistant",
      text: "I'm having trouble processing your request. Please try again later.",
    })
  }
}
