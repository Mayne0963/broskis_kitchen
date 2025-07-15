import OpenAI from "openai"
import { vectorStore } from "../utils/vectorStore"

// Initialize OpenAI client with the provided API key


// System prompt template
const SYSTEM_PROMPT = `You are BroskiBot, the AI assistant for Broski's Kitchen, a luxury street gourmet restaurant.
Your goal is to provide helpful, accurate information about Broski's Kitchen to customers.
You should be friendly, professional, and knowledgeable about the restaurant's menu, locations, events, and services.
If you don't know the answer to a question, you should say so and offer to help with something else.
Here is some information about Broski's Kitchen that you can use to answer questions:

{{context}}

Remember to stay in character as BroskiBot and only provide information related to Broski's Kitchen.`

// Function to generate a response using OpenAI
export async function generateChatResponse(messages: { role: string; text: string }[], query: string): Promise<string> {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key' || process.env.OPENAI_API_KEY === 'sk-your-actual-openai-api-key-here') {
      console.error('OpenAI API key is not configured properly')
      return "I'm currently unable to process your request because my AI services are not properly configured. Please contact support or try again later."
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Search for relevant content
    const searchResults = vectorStore.search(query)

    // Create context from search results
    const context = searchResults.map((result) => result.text).join("\n\n")

    // Create system message with context
    const systemMessage = SYSTEM_PROMPT.replace("{{context}}", context)

    // Format messages for OpenAI
    const formattedMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemMessage },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" as const : "assistant" as const,
        content: msg.text,
      })),
    ]

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
    })

    // Return the generated response
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response."
  } catch (error: unknown) {
    console.error("Error generating chat response:", error)
    
    // Provide specific error messages based on error type
    const errorObj = error as { status?: number }
    if (errorObj?.status === 401) {
      return "I'm having authentication issues with my AI services. Please contact support."
    } else if (errorObj?.status === 429) {
      return "I'm currently experiencing high demand. Please try again in a moment."
    } else if (errorObj?.status === 500) {
      return "My AI services are temporarily unavailable. Please try again later."
    } else {
      return "I'm having trouble connecting to my services. Please try again later."
    }
  }
}
