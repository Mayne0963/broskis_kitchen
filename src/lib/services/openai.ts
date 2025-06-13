import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface VerificationResult {
  success: boolean
  message: string
  isAuthentic?: boolean
  isOver21?: boolean
  facesMatch?: boolean
  dob?: string
}

/**
 * Verifies an ID document and selfie using OpenAI's Vision API
 * @param idImage Base64 encoded image of the ID
 * @param selfieImage Base64 encoded image of the selfie
 * @returns Verification result
 */
export async function verifyIDWithAI(idImage: string, selfieImage: string): Promise<VerificationResult> {
  try {
    // Step 1: Analyze the ID document
    const idAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an ID verification expert. Analyze the provided ID document and extract key information. Determine if it appears to be an authentic government-issued ID.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this ID document. Extract the full name, date of birth, ID number, and expiration date if visible. Determine if this appears to be an authentic government-issued ID. Format the date of birth as YYYY-MM-DD.",
            },
            {
              type: "image_url",
              image_url: {
                url: idImage,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    })

    const idAnalysis = idAnalysisResponse.choices[0].message.content || ""

    // Step 2: Check if the ID appears authentic
    const authenticityResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an ID verification expert. Your task is to determine if an ID appears authentic based on analysis.",
        },
        {
          role: "user",
          content: `Based on this ID analysis, does the ID appear to be an authentic government-issued ID? Respond with only "YES" or "NO".\n\nAnalysis: ${idAnalysis}`,
        },
      ],
      max_tokens: 10,
    })

    const isAuthentic = authenticityResponse.choices[0].message.content?.trim().toUpperCase() === "YES"

    // Step 3: Extract DOB and check if over 21
    let dob = null
    let isOver21 = false

    // Extract DOB using regex (looking for YYYY-MM-DD format)
    const dobMatch = idAnalysis.match(/\b(\d{4}-\d{2}-\d{2})\b/)
    if (dobMatch && dobMatch[1]) {
      dob = dobMatch[1]

      // Calculate age
      const dobDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - dobDate.getFullYear()
      const monthDiff = today.getMonth() - dobDate.getMonth()

      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--
      }

      isOver21 = age >= 21
    }

    // Step 4: Compare faces between ID and selfie
    const faceComparisonResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a facial recognition expert. Compare the face in the ID document with the face in the selfie and determine if they appear to be the same person.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Do these two images show the same person? The first image is an ID document, and the second is a selfie. Respond with only 'YES' or 'NO'.",
            },
            {
              type: "image_url",
              image_url: {
                url: idImage,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: selfieImage,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    })

    const facesMatch = faceComparisonResponse.choices[0].message.content?.trim().toUpperCase() === "YES"

    // Step 5: Determine overall verification result
    const success = isAuthentic && isOver21 && facesMatch

    let message = "Verification successful."
    if (!isAuthentic) {
      message = "ID verification failed. The ID does not appear to be authentic."
    } else if (!isOver21) {
      message = "Age verification failed. You must be 21 or older."
    } else if (!facesMatch) {
      message = "Face verification failed. The selfie does not match the ID photo."
    }

    return {
      success,
      message,
      isAuthentic,
      isOver21,
      facesMatch,
      dob,
    }
  } catch (error) {
    console.error("Error in OpenAI verification:", error)
    return {
      success: false,
      message: "An error occurred during verification. Please try again.",
    }
  }
}
