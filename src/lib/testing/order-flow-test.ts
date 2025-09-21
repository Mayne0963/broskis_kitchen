export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { adminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/services/logging-service';
import { saveOrder, getOrderById, updateOrderStatus, trackOrder, cancelOrder } from '@/lib/services/orderService';
import { NotificationService } from '@/lib/services/notification-service';
import { DriverCommunicationService } from '@/lib/services/driver-communication-service';
import { OrderService } from '@/lib/services/order-service';
import { PaymentService } from '@/lib/services/payment-service';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: boolean;
  totalDuration: number;
  passedCount: number;
  failedCount: number;
}

interface TestUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface TestOrder {
  id?: string;
  userId: string;
  restaurantId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  deliveryAddress: any;
  paymentMethodId: string;
}

class OrderFlowTestSuite {
  private testUsers: TestUser[] = [];
  private testOrders: TestOrder[] = [];
  private testResults: TestSuite[] = [];
  private cleanup: Array<() => Promise<void>> = [];

  constructor() {
    this.setupTestData();
  }

  private setupTestData() {
    // Test users
    this.testUsers = [
      {
        id: 'test_user_1',
        email: 'test1@example.com',
        phone: '+1234567890',
        name: 'Test User 1',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      },
      {
        id: 'test_user_2',
        email: 'test2@example.com',
        phone: '+1234567891',
        name: 'Test User 2',
        address: {
          street: '456 Test Ave',
          city: 'Test City',
          state: 'TS',
          zipCode: '12346'
        }
      }
    ];

    // Test orders
    this.testOrders = [
      {
        userId: 'test_user_1',
        restaurantId: 'test_restaurant_1',
        items: [
          {
            id: 'item_1',
            name: 'Test Burger',
            price: 12.99,
            quantity: 2
          },
          {
            id: 'item_2',
            name: 'Test Fries',
            price: 4.99,
            quantity: 1
          }
        ],
        total: 30.97,
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        paymentMethodId: 'pm_test_card'
      }
    ];
  }

  private async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting test: ${testName}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      logger.info(`Test passed: ${testName}`, { duration });
      return {
        testName,
        passed: true,
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`Test failed: ${testName}`, error, { duration });
      return {
        testName,
        passed: false,
        duration,
        error: errorMessage
      };
    }
  }

  private async createTestUser(user: TestUser): Promise<void> {
    await adminDb.collection(COLLECTIONS.USERS).doc(user.id).set({
      email: user.email,
      phone: user.phone,
      name: user.name,
      address: user.address,
      createdAt: new Date().toISOString(),
      isTestUser: true
    });

    this.cleanup.push(async () => {
      await adminDb.collection(COLLECTIONS.USERS).doc(user.id).delete();
    });
  }

  private async createTestRestaurant(): Promise<string> {
    const restaurantId = 'test_restaurant_1';
    await adminDb.collection('restaurants').doc(restaurantId).set({
      name: 'Test Restaurant',
      address: {
        street: '789 Restaurant St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12347'
      },
      phone: '+1234567892',
      email: 'restaurant@test.com',
      isActive: true,
      isTestRestaurant: true,
      menu: [
        {
          id: 'item_1',
          name: 'Test Burger',
          price: 12.99,
          category: 'Main',
          available: true
        },
        {
          id: 'item_2',
          name: 'Test Fries',
          price: 4.99,
          category: 'Sides',
          available: true
        }
      ],
      createdAt: new Date().toISOString()
    });

    this.cleanup.push(async () => {
      await db.collection('restaurants').doc(restaurantId).delete();
    });

    return restaurantId;
  }

  private async createTestDriver(): Promise<string> {
    const driverId = 'test_driver_1';
    await db.collection('drivers').doc(driverId).set({
      name: 'Test Driver',
      email: 'driver@test.com',
      phone: '+1234567893',
      status: 'available',
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      vehicle: {
        type: 'car',
        make: 'Test',
        model: 'Vehicle',
        licensePlate: 'TEST123'
      },
      isTestDriver: true,
      createdAt: new Date().toISOString()
    });

    this.cleanup.push(async () => {
      await db.collection('drivers').doc(driverId).delete();
    });

    return driverId;
  }

  // Test Suite 1: Order Creation and Payment
  private async testOrderCreationAndPayment(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Create order
    tests.push(await this.runTest('Create Order', async () => {
      const testOrder = this.testOrders[0];
      
      const orderId = await saveOrder({
        userId: testOrder.userId,
        restaurantId: testOrder.restaurantId,
        items: testOrder.items,
        orderType: 'delivery',
        deliveryAddress: testOrder.deliveryAddress,
        specialInstructions: 'Test order - please ignore',
        subtotal: testOrder.total - 5, // Assuming $5 for tax
        tax: 5,
        paymentMethodId: testOrder.paymentMethodId
      });

      if (!orderId) {
        throw new Error('Order ID not generated');
      }

      this.testOrders[0].id = orderId;
      
      return { orderId, status: 'pending' };
    }));

    // Test 2: Update order status to confirmed (simulating payment success)
    tests.push(await this.runTest('Update Order Status', async () => {
      if (!this.testOrders[0].id) {
        throw new Error('No order ID available for status update test');
      }

      await updateOrderStatus(this.testOrders[0].id, 'confirmed');
      
      const updatedOrder = await getOrderById(this.testOrders[0].id);
      if (!updatedOrder || updatedOrder.status !== 'confirmed') {
        throw new Error('Order status was not updated correctly');
      }

      return { 
        orderId: this.testOrders[0].id,
        status: updatedOrder.status 
      };
    }));

    // Test 3: Track order
    tests.push(await this.runTest('Track Order', async () => {
      if (!this.testOrders[0].id) {
        throw new Error('No order ID available');
      }

      const trackedOrder = await trackOrder(this.testOrders[0].id);

      if (!trackedOrder) {
        throw new Error('Order not found during tracking');
      }

      return { 
        orderId: trackedOrder.id, 
        status: trackedOrder.status,
        total: trackedOrder.total
      };
    }));

    const totalDuration = Date.now() - startTime;
    const passedCount = tests.filter(t => t.passed).length;
    const failedCount = tests.length - passedCount;

    return {
      name: 'Order Creation and Payment',
      tests,
      passed: failedCount === 0,
      totalDuration,
      passedCount,
      failedCount
    };
  }

  // Test Suite 2: Notification System
  private async testNotificationSystem(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Send push notification
    tests.push(await this.runTest('Send Push Notification', async () => {
      const notificationService = new NotificationService();
      
      const result = await notificationService.sendPushNotification({
        userId: this.testUsers[0].id,
        title: 'Order Update',
        body: `Your order ${this.testOrders[0].id} is ready for pickup!`,
        data: {
          orderId: this.testOrders[0].id || 'test_order',
          type: 'order_ready'
        }
      });

      if (!result.success) {
        throw new Error(`Push notification failed: ${result.error}`);
      }

      return { notificationsSent: result.notificationsSent };
    }));

    const totalDuration = Date.now() - startTime;
    const passedCount = tests.filter(t => t.passed).length;
    const failedCount = tests.length - passedCount;

    return {
      name: 'Notification System',
      tests,
      passed: failedCount === 0,
      totalDuration,
      passedCount,
      failedCount
    };
  }

  // Test Suite 3: Driver Communication
  private async testDriverCommunication(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();
    const driverId = 'test_driver_1';

    // Test 1: Assign driver to order
    tests.push(await this.runTest('Assign Driver to Order', async () => {
      if (!this.testOrders[0].id) {
        throw new Error('No order ID available');
      }

      const driverService = new DriverCommunicationService();
      
      const result = await driverService.assignDriver(this.testOrders[0].id, driverId);

      if (!result.success) {
        throw new Error(`Driver assignment failed: ${result.error}`);
      }

      return { driverId, orderId: this.testOrders[0].id };
    }));

    // Test 2: Update driver location
    tests.push(await this.runTest('Update Driver Location', async () => {
      const driverService = new DriverCommunicationService();
      
      const result = await driverService.updateDriverLocation(driverId, {
        latitude: 40.7589,
        longitude: -73.9851,
        timestamp: new Date().toISOString()
      });

      if (!result.success) {
        throw new Error(`Location update failed: ${result.error}`);
      }

      return { location: result.location };
    }));

    // Test 3: Send delivery update
    tests.push(await this.runTest('Send Delivery Update', async () => {
      if (!this.testOrders[0].id) {
        throw new Error('No order ID available');
      }

      const driverService = new DriverCommunicationService();
      
      const result = await driverService.sendDeliveryUpdate({
        orderId: this.testOrders[0].id,
        driverId,
        status: 'out_for_delivery',
        message: 'Your order is on the way!',
        estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      if (!result.success) {
        throw new Error(`Delivery update failed: ${result.error}`);
      }

      return { updateId: result.updateId };
    }));

    // Test 4: Chat message
    tests.push(await this.runTest('Send Chat Message', async () => {
      if (!this.testOrders[0].id) {
        throw new Error('No order ID available');
      }

      const driverService = new DriverCommunicationService();
      
      const result = await driverService.sendChatMessage({
        orderId: this.testOrders[0].id,
        senderId: driverId,
        senderType: 'driver',
        message: 'I\'m outside your building',
        messageType: 'text'
      });

      if (!result.success) {
        throw new Error(`Chat message failed: ${result.error}`);
      }

      return { messageId: result.messageId };
    }));

    const totalDuration = Date.now() - startTime;
    const passedCount = tests.filter(t => t.passed).length;
    const failedCount = tests.length - passedCount;

    return {
      name: 'Driver Communication',
      tests,
      passed: failedCount === 0,
      totalDuration,
      passedCount,
      failedCount
    };
  }

  // Test Suite 4: Order Status Flow
  private async testOrderStatusFlow(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    const statusFlow = [
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered'
    ];

    for (const status of statusFlow) {
      tests.push(await this.runTest(`Update Order Status to ${status}`, async () => {
        if (!this.testOrders[0].id) {
          throw new Error('No order ID available');
        }

        const orderService = new OrderService();
        
        const result = await orderService.updateOrderStatus(
          this.testOrders[0].id,
          status as any
        );

        if (!result.success) {
          throw new Error(`Status update failed: ${result.error}`);
        }

        // Verify status was updated
        const orderDoc = await db.collection(COLLECTIONS.ORDERS).doc(this.testOrders[0].id).get();
        const orderData = orderDoc.data();

        if (orderData?.status !== status) {
          throw new Error(`Expected status '${status}', got '${orderData?.status}'`);
        }

        return { status: orderData.status, updatedAt: orderData.updatedAt };
      }));

      // Add delay between status updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const totalDuration = Date.now() - startTime;
    const passedCount = tests.filter(t => t.passed).length;
    const failedCount = tests.length - passedCount;

    return {
      name: 'Order Status Flow',
      tests,
      passed: failedCount === 0,
      totalDuration,
      passedCount,
      failedCount
    };
  }

  // Test Suite 5: Refund and Cancellation
  private async testRefundAndCancellation(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Create a separate order for cancellation testing
    let cancellationOrderId: string;

    tests.push(await this.runTest('Create Order for Cancellation', async () => {
      const orderService = new OrderService();
      
      const order = await orderService.createOrder({
        userId: this.testUsers[1].id,
        restaurantId: 'test_restaurant_1',
        items: [{
          id: 'item_1',
          name: 'Test Burger',
          price: 12.99,
          quantity: 1
        }],
        deliveryAddress: this.testUsers[1].address,
        specialInstructions: 'Test cancellation order'
      });

      cancellationOrderId = order.id!;
      
      this.cleanup.push(async () => {
        await db.collection(COLLECTIONS.ORDERS).doc(cancellationOrderId).delete();
      });

      return { orderId: cancellationOrderId };
    }));

    // Test cancellation
    tests.push(await this.runTest('Cancel Order', async () => {
      const orderService = new OrderService();
      
      const result = await orderService.cancelOrder(
        cancellationOrderId,
        'Customer requested cancellation'
      );

      if (!result.success) {
        throw new Error(`Cancellation failed: ${result.error}`);
      }

      return { cancellationId: result.cancellationId };
    }));

    // Test refund processing
    tests.push(await this.runTest('Process Refund', async () => {
      const paymentService = new PaymentService();
      
      const result = await paymentService.processRefund({
        orderId: cancellationOrderId,
        amount: 12.99,
        reason: 'Order cancelled by customer'
      });

      if (!result.success) {
        throw new Error(`Refund failed: ${result.error}`);
      }

      return { refundId: result.refundId, status: result.status };
    }));

    const totalDuration = Date.now() - startTime;
    const passedCount = tests.filter(t => t.passed).length;
    const failedCount = tests.length - passedCount;

    return {
      name: 'Refund and Cancellation',
      tests,
      passed: failedCount === 0,
      totalDuration,
      passedCount,
      failedCount
    };
  }

  // Main test runner
  async runAllTests(): Promise<{
    suites: TestSuite[];
    summary: {
      totalSuites: number;
      passedSuites: number;
      failedSuites: number;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      totalDuration: number;
    };
  }> {
    logger.info('Starting end-to-end order flow tests');
    
    try {
      // Setup test data
      await this.setupTestEnvironment();

      // Run test suites
      const suites: TestSuite[] = [];
      
      suites.push(await this.testOrderCreationAndPayment());
      suites.push(await this.testNotificationSystem());
      suites.push(await this.testDriverCommunication());
      suites.push(await this.testOrderStatusFlow());
      suites.push(await this.testRefundAndCancellation());

      // Calculate summary
      const summary = {
        totalSuites: suites.length,
        passedSuites: suites.filter(s => s.passed).length,
        failedSuites: suites.filter(s => !s.passed).length,
        totalTests: suites.reduce((sum, s) => sum + s.tests.length, 0),
        passedTests: suites.reduce((sum, s) => sum + s.passedCount, 0),
        failedTests: suites.reduce((sum, s) => sum + s.failedCount, 0),
        totalDuration: suites.reduce((sum, s) => sum + s.totalDuration, 0)
      };

      logger.info('End-to-end tests completed', { summary });

      return { suites, summary };
    } catch (error) {
      logger.error('Test execution failed', error);
      throw error;
    } finally {
      // Cleanup test data
      await this.cleanupTestEnvironment();
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    logger.info('Setting up test environment');
    
    // Create test users
    for (const user of this.testUsers) {
      await this.createTestUser(user);
    }

    // Create test restaurant
    await this.createTestRestaurant();

    // Create test driver
    await this.createTestDriver();

    logger.info('Test environment setup complete');
  }

  private async cleanupTestEnvironment(): Promise<void> {
    logger.info('Cleaning up test environment');
    
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        logger.warn('Cleanup function failed', error);
      }
    }

    this.cleanup = [];
    logger.info('Test environment cleanup complete');
  }

  // Generate test report
  generateReport(results: {
    suites: TestSuite[];
    summary: any;
  }): string {
    let report = '\n=== END-TO-END ORDER FLOW TEST REPORT ===\n\n';
    
    // Summary
    report += `SUMMARY:\n`;
    report += `  Total Suites: ${results.summary.totalSuites}\n`;
    report += `  Passed Suites: ${results.summary.passedSuites}\n`;
    report += `  Failed Suites: ${results.summary.failedSuites}\n`;
    report += `  Total Tests: ${results.summary.totalTests}\n`;
    report += `  Passed Tests: ${results.summary.passedTests}\n`;
    report += `  Failed Tests: ${results.summary.failedTests}\n`;
    report += `  Total Duration: ${results.summary.totalDuration}ms\n\n`;

    // Detailed results
    for (const suite of results.suites) {
      report += `SUITE: ${suite.name} ${suite.passed ? '✅' : '❌'}\n`;
      report += `  Duration: ${suite.totalDuration}ms\n`;
      report += `  Passed: ${suite.passedCount}/${suite.tests.length}\n\n`;
      
      for (const test of suite.tests) {
        report += `  ${test.passed ? '✅' : '❌'} ${test.testName} (${test.duration}ms)\n`;
        if (!test.passed && test.error) {
          report += `    Error: ${test.error}\n`;
        }
      }
      report += '\n';
    }

    return report;
  }
}

// Export the test suite
export { OrderFlowTestSuite, TestResult, TestSuite };

// Utility function to run tests
export async function runOrderFlowTests(): Promise<string> {
  const testSuite = new OrderFlowTestSuite();
  const results = await testSuite.runAllTests();
  return testSuite.generateReport(results);
}