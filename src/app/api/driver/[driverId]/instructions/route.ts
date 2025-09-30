export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ensureAdmin } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface DeliveryInstructions {
  id?: string;
  deliveryId: string;
  customerId: string;
  driverId?: string;
  pickupInstructions?: {
    restaurantNotes?: string;
    specialRequests?: string;
    contactPerson?: string;
    contactPhone?: string;
    parkingInfo?: string;
  };
  deliveryInstructions?: {
    customerNotes?: string;
    deliveryNotes?: string;
    accessCode?: string;
    floorApartment?: string;
    landmarkNotes?: string;
    contactPreference?: 'call' | 'text' | 'knock' | 'doorbell';
    leaveAtDoor?: boolean;
    signatureRequired?: boolean;
  };
  specialHandling?: {
    fragileItems?: boolean;
    temperatureSensitive?: boolean;
    allergyWarnings?: string[];
    dietaryRestrictions?: string[];
  };
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
}

// GET - Get delivery instructions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    await ensureAdmin(request);
    const { driverId } = await params;

    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Missing deliveryId parameter' },
        { status: 400 }
      );
    }

    // Get delivery to verify access
    const deliveryDoc = await adminDb.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const deliveryData = deliveryDoc.data();
    
    // Admin access verified by ensureAdmin

    // Get instructions
    const instructionsSnapshot = await adminDb.collection('delivery_instructions')
      .where('deliveryId', '==', deliveryId)
      .limit(1)
      .get();

    let instructions = null;
    if (!instructionsSnapshot.empty) {
      const doc = instructionsSnapshot.docs[0];
      instructions = {
        id: doc.id,
        ...doc.data()
      };
    }

    // Admin has full access to all instructions

    // Get order details for context
    const orderDoc = await adminDb.collection(COLLECTIONS.ORDERS).doc(deliveryData.orderId).get();
    const orderData = orderDoc.exists ? orderDoc.data() : null;

    return NextResponse.json({
      instructions,
      delivery: {
        id: deliveryId,
        status: deliveryData.status,
        estimatedPickupTime: deliveryData.estimatedPickupTime,
        estimatedDeliveryTime: deliveryData.estimatedDeliveryTime,
        pickupAddress: deliveryData.pickupAddress,
        deliveryAddress: deliveryData.deliveryAddress
      },
      order: orderData ? {
        id: deliveryData.orderId,
        items: orderData.items,
        specialRequests: orderData.specialRequests,
        totalAmount: orderData.totalAmount
      } : null
    });

  } catch (error) {
    console.error('Error getting delivery instructions:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get delivery instructions' },
      { status: 500 }
    );
  }
}

// PUT - Update delivery instructions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    await ensureAdmin(request);
    const { driverId } = await params;

    const body = await request.json();
    const { deliveryId, pickupInstructions, deliveryInstructions, specialHandling } = body;

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Missing deliveryId' },
        { status: 400 }
      );
    }

    // Get delivery to verify access
    const deliveryDoc = await adminDb.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const deliveryData = deliveryDoc.data();
    
    // Admin access verified by ensureAdmin

    // Check if delivery is in a state where instructions can be modified
    const modifiableStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup'];
    if (!modifiableStatuses.includes(deliveryData.status)) {
      return NextResponse.json(
        { error: `Cannot modify instructions when delivery status is ${deliveryData.status}` },
        { status: 400 }
      );
    }

    // Get existing instructions
    const instructionsSnapshot = await adminDb.collection('delivery_instructions')
      .where('deliveryId', '==', deliveryId)
      .limit(1)
      .get();

    let instructionsRef;
    let existingInstructions = {};
    
    if (!instructionsSnapshot.empty) {
      const doc = instructionsSnapshot.docs[0];
      instructionsRef = doc.ref;
      existingInstructions = doc.data();
    } else {
      instructionsRef = adminDb.collection('delivery_instructions').doc();
    }

    // Prepare update data based on user role
    const updateData: Partial<DeliveryInstructions> = {
      deliveryId,
      customerId: deliveryData.customerId,
      driverId: deliveryData.driverId,
      lastModifiedBy: 'admin',
      updatedAt: new Date().toISOString()
    };

    // Set createdAt if this is a new document
    if (instructionsSnapshot.empty) {
      updateData.createdAt = new Date().toISOString();
    }

    // Admin can update all instructions
    if (pickupInstructions) updateData.pickupInstructions = pickupInstructions;
    if (deliveryInstructions) updateData.deliveryInstructions = deliveryInstructions;
    if (specialHandling) updateData.specialHandling = specialHandling;

    // Validate instruction data
    const validationError = validateInstructions(updateData);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Update instructions
    await instructionsRef.set(updateData, { merge: true });

    // Log the update
    await adminDb.collection('delivery_instruction_history').add({
      deliveryId,
      instructionsId: instructionsRef.id,
      modifiedBy: 'admin',
      userRole: 'admin',
      changes: getChanges(existingInstructions, updateData),
      timestamp: new Date().toISOString()
    });

    // Notify relevant parties of instruction updates
    await notifyInstructionUpdate(deliveryData, updateData, 'admin');

    // Get updated instructions
    const updatedDoc = await instructionsRef.get();
    const updatedInstructions = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    return NextResponse.json({
      success: true,
      message: 'Delivery instructions updated successfully',
      instructions: updatedInstructions
    });

  } catch (error) {
    console.error('Error updating delivery instructions:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update delivery instructions' },
      { status: 500 }
    );
  }
}

// Helper function to validate instruction data
function validateInstructions(instructions: Partial<DeliveryInstructions>): string | null {
  // Validate contact preferences
  if (instructions.deliveryInstructions?.contactPreference) {
    const validPreferences = ['call', 'text', 'knock', 'doorbell'];
    if (!validPreferences.includes(instructions.deliveryInstructions.contactPreference)) {
      return `Invalid contact preference. Must be one of: ${validPreferences.join(', ')}`;
    }
  }

  // Validate phone numbers if provided
  if (instructions.pickupInstructions?.contactPhone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(instructions.pickupInstructions.contactPhone.replace(/[\s\-\(\)]/g, ''))) {
      return 'Invalid phone number format';
    }
  }

  // Validate allergy warnings
  if (instructions.specialHandling?.allergyWarnings) {
    if (!Array.isArray(instructions.specialHandling.allergyWarnings)) {
      return 'Allergy warnings must be an array';
    }
  }

  // Validate dietary restrictions
  if (instructions.specialHandling?.dietaryRestrictions) {
    if (!Array.isArray(instructions.specialHandling.dietaryRestrictions)) {
      return 'Dietary restrictions must be an array';
    }
  }

  return null;
}

// Helper function to get changes between old and new instructions
function getChanges(oldInstructions: any, newInstructions: any): any {
  const changes: any = {};
  
  // Compare pickup instructions
  if (JSON.stringify(oldInstructions.pickupInstructions) !== JSON.stringify(newInstructions.pickupInstructions)) {
    changes.pickupInstructions = {
      old: oldInstructions.pickupInstructions,
      new: newInstructions.pickupInstructions
    };
  }
  
  // Compare delivery instructions
  if (JSON.stringify(oldInstructions.deliveryInstructions) !== JSON.stringify(newInstructions.deliveryInstructions)) {
    changes.deliveryInstructions = {
      old: oldInstructions.deliveryInstructions,
      new: newInstructions.deliveryInstructions
    };
  }
  
  // Compare special handling
  if (JSON.stringify(oldInstructions.specialHandling) !== JSON.stringify(newInstructions.specialHandling)) {
    changes.specialHandling = {
      old: oldInstructions.specialHandling,
      new: newInstructions.specialHandling
    };
  }
  
  return changes;
}

// Helper function to notify parties of instruction updates
async function notifyInstructionUpdate(deliveryData: any, instructions: any, modifiedBy: string) {
  try {
    const notificationPromises = [];
    
    // Notify driver if instructions were updated by customer/restaurant
    if (deliveryData.driverId && deliveryData.driverId !== modifiedBy) {
      notificationPromises.push(
        adminDb.collection('notifications').add({
          userId: deliveryData.driverId,
          type: 'instruction_update',
          title: 'Delivery Instructions Updated',
          body: 'The delivery instructions for your current delivery have been updated.',
          data: {
            deliveryId: deliveryData.id,
            orderId: deliveryData.orderId
          },
          timestamp: new Date().toISOString(),
          read: false
        })
      );
    }
    
    // Notify customer if instructions were updated by restaurant/driver
    if (deliveryData.customerId && deliveryData.customerId !== modifiedBy) {
      notificationPromises.push(
        adminDb.collection('notifications').add({
          userId: deliveryData.customerId,
          type: 'instruction_update',
          title: 'Delivery Instructions Updated',
          body: 'Your delivery instructions have been updated.',
          data: {
            deliveryId: deliveryData.id,
            orderId: deliveryData.orderId
          },
          timestamp: new Date().toISOString(),
          read: false
        })
      );
    }
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error sending instruction update notifications:', error);
  }
}