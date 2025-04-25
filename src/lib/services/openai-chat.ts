import OpenAI from "openai"
import { vectorStore } from "../utils/vectorStore"

// Initialize OpenAI client with the provided API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    // Search for relevant content
    const searchResults = vectorStore.search(query)

    // Create context from search results
    const context = searchResults.map((result) => result.text).join("\n\n")

    // Create system message with context
    const systemMessage = SYSTEM_PROMPT.replace("{{context}}", context)

    // Format messages for OpenAI
    const formattedMessages = [
      { role: "system", content: systemMessage },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ]

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 500,
    })

    // Return the generated response
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response."
  } catch (error) {
    console.error("Error generating chat response:", error)
    return "I'm having trouble connecting to my services. Please try again later."
  }
}
