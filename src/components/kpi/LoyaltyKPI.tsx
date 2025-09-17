"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface LoyaltyKPIProps {
  userId?: string;
}

export default function LoyaltyKPI({ userId }: LoyaltyKPIProps) {
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLoyalty = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // TODO: Replace with actual API call to fetch user's loyalty points
        // const response = await fetch(`/api/user/loyalty?userId=${userId}`);
        // const data = await response.json();
        // setLoyaltyPoints(data.points);
        
        // Mock data for now - only user's loyalty points
        setLoyaltyPoints(450);
      } catch (error) {
        console.error('Error fetching user loyalty points:', error);
        setLoyaltyPoints(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLoyalty();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
            <p className="text-2xl font-bold text-gray-900">{loyaltyPoints.toLocaleString()}</p>
          </div>
          <Star className="h-8 w-8 text-yellow-600" />
        </div>
      </CardContent>
    </Card>
  );
}