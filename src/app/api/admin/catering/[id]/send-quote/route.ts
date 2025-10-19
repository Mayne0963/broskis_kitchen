import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { isAdmin, normalizeRole } from "@/lib/roles";
import { mapDoc } from "@/lib/catering/transform";
import type { CateringRequest } from "@/types/catering";
import { Resend } from "resend";
import { getServerUser } from "@/lib/session";

// Initialize Resend with API key from environment (only if available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication using custom session system
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const userRole = normalizeRole(user.roles?.[0] || 'user');
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Validate ID parameter
    if (!params.id || typeof params.id !== "string") {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    // Fetch catering document from Firestore
    const doc = await db.collection("cateringRequests").doc(params.id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Catering request not found" }, { status: 404 });
    }

    // Transform document
    const cateringRequest = mapDoc(doc.id, doc.data()) as CateringRequest;

    // Validate required fields for sending quote
    if (!cateringRequest.customer?.email) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
    }

    if (!cateringRequest.stripe?.checkoutUrl) {
      return NextResponse.json({ error: "Stripe checkout URL not available" }, { status: 400 });
    }

    if (!cateringRequest.price?.total) {
      return NextResponse.json({ error: "Total price not available" }, { status: 400 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      return NextResponse.json({ error: "Email service not configured. Please set RESEND_API_KEY environment variable." }, { status: 500 });
    }

    // Format event date
    const eventDate = cateringRequest.event?.date 
      ? new Date(cateringRequest.event.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Date TBD';

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Catering Quote from Broski's Kitchen</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                Broski's Kitchen
              </h1>
              <p style="color: #c0c0c0; margin: 10px 0 0 0; font-size: 16px;">
                Premium Catering Services
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px;">
                Your Catering Quote is Ready!
              </h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                Dear ${cateringRequest.customer.name || 'Valued Customer'},
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                Thank you for choosing Broski's Kitchen for your upcoming event. We're excited to provide exceptional catering services for your special occasion.
              </p>

              <!-- Event Details -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #d4af37; padding: 20px; margin: 25px 0;">
                <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px;">Event Details</h3>
                <p style="color: #333333; margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${eventDate}</p>
                <p style="color: #333333; margin: 5px 0; font-size: 14px;"><strong>Guests:</strong> ${cateringRequest.event?.guestCount || 'TBD'}</p>
                <p style="color: #333333; margin: 5px 0; font-size: 14px;"><strong>Package:</strong> ${cateringRequest.event?.packageTier || 'Custom Package'}</p>
                ${cateringRequest.event?.location ? `<p style="color: #333333; margin: 5px 0; font-size: 14px;"><strong>Location:</strong> ${cateringRequest.event.location}</p>` : ''}
              </div>

              <!-- Total Price -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #333333; margin: 0 0 10px 0; font-size: 16px;">Total Investment</p>
                <p style="color: #d4af37; margin: 0; font-size: 36px; font-weight: bold;">
                  $${cateringRequest.price.total.toFixed(2)}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${cateringRequest.stripe.checkoutUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3); transition: all 0.3s ease;">
                  Secure Your Date - Pay Now
                </a>
              </div>

              <p style="color: #666666; line-height: 1.6; margin: 25px 0 0 0; font-size: 14px; text-align: center;">
                Questions? Reply to this email or call us directly. We're here to make your event unforgettable.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666666; margin: 0; font-size: 14px;">
                © 2024 Broski's Kitchen. Premium catering services.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'Broski\'s Kitchen <noreply@broskiskitchen.com>',
      to: [cateringRequest.customer.email],
      subject: `Your Catering Quote - ${eventDate}`,
      html: emailHtml,
    });

    // Log success for debugging
    console.log('Quote email sent successfully:', {
      emailId: emailResult.data?.id,
      to: cateringRequest.customer.email,
      cateringId: params.id,
      total: cateringRequest.price.total
    });

    return NextResponse.json({
      success: true,
      message: 'Quote email sent successfully',
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error("Error sending quote email:", error);
    return NextResponse.json(
      { error: "Failed to send quote email" }, 
      { status: 500 }
    );
  }
}