import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = contactSchema.parse(body)
    
    // Rate limiting check (simple implementation)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    // In a real application, you would:
    // 1. Store the message in a database
    // 2. Send an email notification
    // 3. Implement proper rate limiting
    // 4. Add spam protection
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Log the contact form submission (in production, use proper logging)
    console.log('Contact form submission:', {
      ...validatedData,
      timestamp: new Date().toISOString(),
      clientIP,
    })
    
    // In a real application, you might send an email here
    // await sendContactEmail(validatedData)
    
    // Send auto-reply email to user
    // await sendAutoReply(validatedData.email, validatedData.name)
    
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message. We will get back to you soon!',
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Contact form error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid form data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  )
}