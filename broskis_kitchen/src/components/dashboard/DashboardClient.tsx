"use client";

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentMethods } from "./PaymentMethods";
import { SavedAddresses } from "./SavedAddresses";
import { PaymentHistory } from "./PaymentHistory";
import { OrderHistory } from "./OrderHistory";
import RewardsTab from './RewardsTab'

interface DashboardClientProps {
  initialPaymentMethods: any[]
  initialAddresses: any[]
  initialPaymentHistory: any[]
  initialOrderHistory: any[]
  userId: string
}

export default function DashboardClient({
  initialPaymentMethods,
  initialAddresses,
  initialPaymentHistory,
  initialOrderHistory,
  userId,
}: DashboardClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[var(--color-harvest-gold)]">User Dashboard</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8 bg-[var(--color-dark-charcoal)] border border-[var(--color-harvest-gold)]/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[var(--color-harvest-gold)] data-[state=active]:text-black text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="data-[state=active]:bg-[var(--color-harvest-gold)] data-[state=active]:text-black text-white"
            >
              Rewards
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-[var(--color-harvest-gold)] data-[state=active]:text-black text-white"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="data-[state=active]:bg-[var(--color-harvest-gold)] data-[state=active]:text-black text-white"
            >
              Payment
            </TabsTrigger>
            <TabsTrigger 
              value="addresses" 
              className="data-[state=active]:bg-[var(--color-harvest-gold)] data-[state=active]:text-black text-white"
            >
              Addresses
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <OrderHistory orders={initialOrderHistory} />
              <PaymentMethods methods={initialPaymentMethods} />
              <SavedAddresses addresses={initialAddresses} />
              <PaymentHistory history={initialPaymentHistory} />
            </div>
          </TabsContent>
          
          <TabsContent value="rewards">
            <RewardsTab userId={userId} />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrderHistory orders={initialOrderHistory} />
          </TabsContent>
          
          <TabsContent value="payment">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PaymentMethods methods={initialPaymentMethods} />
              <PaymentHistory history={initialPaymentHistory} />
            </div>
          </TabsContent>
          
          <TabsContent value="addresses">
            <SavedAddresses addresses={initialAddresses} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}