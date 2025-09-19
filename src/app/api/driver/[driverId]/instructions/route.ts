export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
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
  { params }: { params: { driverId: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const { driverId } = params;

    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Missing deliveryId parameter' },
        { status: 400 }
      );
    }

    // Get delivery to verify access
    const deliveryDoc = await db.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const deliveryData = deliveryDoc.data();
    
    // Verify user has access to these instructions
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && userId === driverId && driverId === deliveryData?.driverId;
    const isCustomer = userId === deliveryData?.customerId;
    const isRestaurant = decodedToken.role === 'restaurant' && userId === deliveryData?.restaurantId;

    if (!isAdmin && !isDriver && !isCustomer && !isRestaurant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get instructions
    const instructionsSnapshot = await db.collection('delivery_instructions')
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

    // Filter sensitive information based on user role
    if (instructions && !isAdmin) {
      if (isDriver) {
        // Drivers can see all instructions but not customer's personal contact info
        delete instructions.deliveryInstructions?.accessCode;
      } else if (isCustomer) {
        // Customers can see their own instructions
        // No filtering needed
      } else if (isRestaurant) {
        // Restaurants only see pickup instructions
        instructions = {
          id: instructions.id,
          deliveryId: instructions.deliveryId,
          pickupInstructions: instructions.pickupInstructions,
          specialHandling: instructions.specialHandling,
          createdAt: instructions.createdAt,
          updatedAt: instructions.updatedAt
        };
      }
    }

    // Get order details for context
    const orderDoc = await db.collection(COLLECTIONS.ORDERS).doc(deliveryData.orderId).get();
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
  { params }: { params: { driverId: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const { driverId } = params;

    const body = await request.json();
    const { deliveryId, pickupInstructions, deliveryInstructions, specialHandling } = body;

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Missing deliveryId' },
        { status: 400 }
      );
    }

    // Get delivery to verify access
    const deliveryDoc = await db.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const deliveryData = deliveryDoc.data();
    
    // Verify user has permission to update instructions
    const isAdmin = decodedToken.admin === true;
    const isCustomer = userId === deliveryData?.customerId;
    const isRestaurant = decodedToken.role === 'restaurant' && userId === deliveryData?.restaurantId;
    const isDriver = decodedToken.role === 'driver' && userId === driverId && driverId === deliveryData?.driverId;

    if (!isAdmin && !isCustomer && !isRestaurant && !isDriver) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if delivery is in a state where instructions can be modified
    const modifiableStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup'];
    if (!modifiableStatuses.includes(deliveryData.status)) {
      return NextResponse.json(
        { error: `Cannot modify instructions when delivery status is ${deliveryData.status}` },
        { status: 400 }
      );
    }

    // Get existing instructions
    const instructionsSnapshot = await db.collection('delivery_instructions')
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
      instructionsRef = db.collection('delivery_instructions').doc();
    }

    // Prepare update data based on user role
    const updateData: Partial<DeliveryInstructions> = {
      deliveryId,
      customerId: deliveryData.customerId,
      driverId: deliveryData.driverId,
      lastModifiedBy: userId,
      updatedAt: new Date().toISOString()
    };

    // Set createdAt if this is a new document
    if (instructionsSnapshot.empty) {
      updateData.createdAt = new Date().toISOString();
    }

    // Apply role-based restrictions
    if (isCustomer || isAdmin) {
      // Customers and admins can update all instructions
      if (pickupInstructions) updateData.pickupInstructions = pickupInstructions;
      if (deliveryInstructions) updateData.deliveryInstructions = deliveryInstructions;
      if (specialHandling) updateData.specialHandling = specialHandling;
    } else if (isRestaurant) {
      // Restaurants can only update pickup instructions
      if (pickupInstructions) updateData.pickupInstructions = pickupInstructions;
      if (specialHandling) updateData.specialHandling = specialHandling;
    } else if (isDriver) {
      // Drivers can only add delivery notes (not modify customer instructions)
      if (deliveryInstructions?.deliveryNotes) {
        updateData.deliveryInstructions = {
          ...existingInstructions.deliveryInstructions,
          deliveryNotes: deliveryInstructions.deliveryNotes
        };
      }
    }

    // Validate instruction data
    const validationError = this.validateInstructions(updateData);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Update instructions
    await instructionsRef.set(updateData, { merge: true });

    // Log the update
    await db.collection('delivery_instruction_history').add({
      deliveryId,
      instructionsId: instructionsRef.id,
      modifiedBy: userId,
      userRole: isAdmin ? 'admin' : (isCustomer ? 'customer' : (isRestaurant ? 'restaurant' : 'driver')),
      changes: this.getChanges(existingInstructions, updateData),
      timestamp: new Date().toISOString()
    });

    // Notify relevant parties of instruction updates
    await this.notifyInstructionUpdate(deliveryData, updateData, userId);

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
        db.collection('notifications').add({
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
        db.collection('notifications').add({
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