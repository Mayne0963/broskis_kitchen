import { NextRequest, NextResponse } from 'next/server';
import { auth, adb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface ChatMessage {
  id?: string;
  deliveryId: string;
  senderId: string;
  senderType: 'customer' | 'driver' | 'support';
  message: string;
  timestamp: string;
  messageType: 'text' | 'location' | 'image' | 'system';
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    imageUrl?: string;
    systemEventType?: string;
  };
  readBy?: string[];
  edited?: boolean;
  editedAt?: string;
}

// POST - Send a chat message
export async function POST(
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
    const senderId = decodedToken.uid;
    const { driverId } = params;

    const body = await request.json();
    const { deliveryId, message, messageType = 'text', metadata } = body;

    // Validate required fields
    if (!deliveryId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: deliveryId, message' },
        { status: 400 }
      );
    }

    // Validate message type
    const validMessageTypes = ['text', 'location', 'image', 'system'];
    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { error: `Invalid messageType. Must be one of: ${validMessageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get delivery to verify access
    const deliveryDoc = await adb.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const deliveryData = deliveryDoc.data();
    
    // Determine sender type and verify permissions
    let senderType: 'customer' | 'driver' | 'support';
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver';
    const isCustomer = senderId === deliveryData?.customerId;
    const isAssignedDriver = senderId === driverId && driverId === deliveryData?.driverId;

    if (isAdmin) {
      senderType = 'support';
    } else if (isDriver && isAssignedDriver) {
      senderType = 'driver';
    } else if (isCustomer) {
      senderType = 'customer';
    } else {
      return NextResponse.json(
        { error: 'Access denied. You are not authorized to send messages for this delivery' },
        { status: 403 }
      );
    }

    // Validate message content based on type
    if (messageType === 'location' && !metadata?.location) {
      return NextResponse.json(
        { error: 'Location metadata required for location messages' },
        { status: 400 }
      );
    }

    if (messageType === 'image' && !metadata?.imageUrl) {
      return NextResponse.json(
        { error: 'Image URL required for image messages' },
        { status: 400 }
      );
    }

    // Create chat message
    const chatMessage: ChatMessage = {
      deliveryId,
      senderId,
      senderType,
      message,
      messageType,
      timestamp: new Date().toISOString(),
      readBy: [senderId], // Sender has read their own message
      edited: false
    };

    if (metadata) {
      chatMessage.metadata = metadata;
    }

    // Save message to database
    const messageRef = await adb.collection('delivery_chat_messages').add(chatMessage);
    const messageId = messageRef.id;

    // Update delivery with last message info
    await adb.collection('deliveries').doc(deliveryId).update({
      lastChatMessage: {
        messageId,
        senderId,
        senderType,
        message: messageType === 'text' ? message : `[${messageType}]`,
        timestamp: chatMessage.timestamp
      },
      lastChatActivity: chatMessage.timestamp,
      updatedAt: new Date().toISOString()
    });

    // Send real-time notification to other participants
    await this.notifyParticipants(deliveryData, chatMessage, messageId);

    // Update chat statistics
    await this.updateChatStats(deliveryId, senderType);

    return NextResponse.json({
      success: true,
      messageId,
      message: {
        id: messageId,
        ...chatMessage
      }
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET - Get chat messages for a delivery
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastMessageId = searchParams.get('lastMessageId');

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Missing deliveryId parameter' },
        { status: 400 }
      );
    }

    // Get delivery to verify access
    const deliveryDoc = await adb.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const deliveryData = deliveryDoc.data();
    
    // Verify user has access to this chat
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && userId === driverId && driverId === deliveryData?.driverId;
    const isCustomer = userId === deliveryData?.customerId;

    if (!isAdmin && !isDriver && !isCustomer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build query for messages
    let query = adb.collection('delivery_chat_messages')
      .where('deliveryId', '==', deliveryId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    // Add pagination if lastMessageId provided
    if (lastMessageId) {
      const lastMessageDoc = await db.collection('delivery_chat_messages').doc(lastMessageId).get();
      if (lastMessageDoc.exists) {
        query = query.startAfter(lastMessageDoc);
      }
    }

    const messagesSnapshot = await query.get();
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Mark messages as read by current user
    await this.markMessagesAsRead(deliveryId, userId, messages.map(m => m.id));

    // Get participant info
    const participants = await this.getParticipants(deliveryData);

    // Get unread count for current user
    const unreadCount = await this.getUnreadCount(deliveryId, userId);

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      participants,
      unreadCount,
      hasMore: messages.length === limit,
      lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : null
    });

  } catch (error) {
    console.error('Error getting chat messages:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

// Helper function to notify participants of new messages
async function notifyParticipants(deliveryData: any, message: ChatMessage, messageId: string) {
  try {
    const participants = [];
    
    // Add customer
    if (deliveryData.customerId && deliveryData.customerId !== message.senderId) {
      participants.push({
        userId: deliveryData.customerId,
        type: 'customer'
      });
    }
    
    // Add driver
    if (deliveryData.driverId && deliveryData.driverId !== message.senderId) {
      participants.push({
        userId: deliveryData.driverId,
        type: 'driver'
      });
    }

    // Send notifications to each participant
    for (const participant of participants) {
      // Create notification record
      await adb.collection('notifications').add({
        userId: participant.userId,
        type: 'chat_message',
        title: `New message from ${message.senderType}`,
        body: message.messageType === 'text' ? message.message : `[${message.messageType}]`,
        data: {
          deliveryId: message.deliveryId,
          messageId,
          senderType: message.senderType
        },
        timestamp: new Date().toISOString(),
        read: false
      });

      // Send push notification if user has enabled them
      // This would integrate with the push notification service
      // await pushNotificationService.sendToUser(participant.userId, ...);
    }
  } catch (error) {
    console.error('Error notifying participants:', error);
  }
}

// Helper function to update chat statistics
async function updateChatStats(deliveryId: string, senderType: string) {
  try {
    const statsRef = adb.collection('delivery_chat_stats').doc(deliveryId);
    const statsDoc = await statsRef.get();
    
    const currentStats = statsDoc.exists ? statsDoc.data() : {
      deliveryId,
      totalMessages: 0,
      messagesBySender: {
        customer: 0,
        driver: 0,
        support: 0
      },
      firstMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    currentStats.totalMessages += 1;
    currentStats.messagesBySender[senderType] += 1;
    currentStats.lastMessageAt = new Date().toISOString();
    currentStats.updatedAt = new Date().toISOString();

    await statsRef.set(currentStats, { merge: true });
  } catch (error) {
    console.error('Error updating chat stats:', error);
  }
}

// Helper function to mark messages as read
async function markMessagesAsRead(deliveryId: string, userId: string, messageIds: string[]) {
  try {
    const batch = adb.batch();
    
    for (const messageId of messageIds) {
      const messageRef = adb.collection('delivery_chat_messages').doc(messageId);
      batch.update(messageRef, {
        readBy: adb.FieldValue.arrayUnion(userId)
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Helper function to get participants info
async function getParticipants(deliveryData: any) {
  try {
    const participants = [];
    
    // Get customer info
    if (deliveryData.customerId) {
      const customerDoc = await adb.collection(COLLECTIONS.USERS).doc(deliveryData.customerId).get();
      if (customerDoc.exists) {
        const customerData = customerDoc.data();
        participants.push({
          id: deliveryData.customerId,
          type: 'customer',
          name: customerData?.displayName || 'Customer',
          avatar: customerData?.photoURL
        });
      }
    }
    
    // Get driver info
    if (deliveryData.driverId) {
      const driverDoc = await adb.collection('drivers').doc(deliveryData.driverId).get();
      if (driverDoc.exists) {
        const driverData = driverDoc.data();
        participants.push({
          id: deliveryData.driverId,
          type: 'driver',
          name: driverData?.name || 'Driver',
          avatar: driverData?.avatar
        });
      }
    }
    
    return participants;
  } catch (error) {
    console.error('Error getting participants:', error);
    return [];
  }
}

// Helper function to get unread message count
async function getUnreadCount(deliveryId: string, userId: string) {
  try {
    const unreadSnapshot = await adb.collection('delivery_chat_messages')
      .where('deliveryId', '==', deliveryId)
      .where('senderId', '!=', userId)
      .get();
    
    let unreadCount = 0;
    unreadSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.readBy || !data.readBy.includes(userId)) {
        unreadCount++;
      }
    });
    
    return unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}