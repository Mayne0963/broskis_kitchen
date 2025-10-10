import { useState } from 'react';
import { toast } from 'sonner';
import { useRewards } from './useRewards';

// Types
interface RewardOffer {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'food' | 'discount' | 'delivery' | 'merchandise';
  imageUrl?: string;
  isActive: boolean;
  tierRequirement?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface RedemptionResult {
  success: boolean;
  message: string;
  redemptionCode?: string;
  newBalance?: number;
  expiresAt?: number;
}

// Sample reward offers - in a real app, this would come from an API
const REWARD_OFFERS: RewardOffer[] = [
  {
    id: 'free_appetizer',
    name: 'Free Appetizer',
    description: 'Choose any appetizer from our menu',
    pointsCost: 250,
    category: 'food',
    isActive: true
  },
  {
    id: 'free_entree',
    name: 'Free Entree',
    description: 'Get any entree on the house',
    pointsCost: 500,
    category: 'food',
    isActive: true
  },
  {
    id: '10_percent_off',
    name: '10% Off',
    description: '10% discount on your next order',
    pointsCost: 150,
    category: 'discount',
    isActive: true
  },
  {
    id: '20_percent_off',
    name: '20% Off',
    description: '20% discount on your next order',
    pointsCost: 300,
    category: 'discount',
    isActive: true
  },
  {
    id: 'free_drink',
    name: 'Free Drink',
    description: 'Any beverage of your choice',
    pointsCost: 100,
    category: 'food',
    isActive: true
  },
  {
    id: 'free_delivery',
    name: 'Free Delivery',
    description: 'Free delivery on your next order',
    pointsCost: 75,
    category: 'delivery',
    isActive: true
  },
  {
    id: 'broski_tshirt',
    name: "Broski's T-Shirt",
    description: 'Official Broski\'s Kitchen merchandise',
    pointsCost: 800,
    category: 'merchandise',
    isActive: true,
    tierRequirement: 'silver'
  },
  {
    id: 'vip_experience',
    name: 'VIP Dining Experience',
    description: 'Private table with chef\'s special menu',
    pointsCost: 2000,
    category: 'food',
    isActive: true,
    tierRequirement: 'gold'
  }
];

export function useRedeem() {
  const { profile, updateLocalPoints, refreshRewards } = useRewards();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionResult[]>([]);

  // Get available rewards based on user's tier and points
  const getAvailableRewards = () => {
    if (!profile) return [];

    const TIER_HIERARCHY = ['bronze', 'silver', 'gold', 'platinum'];
    const userTierIndex = TIER_HIERARCHY.indexOf(profile.tier);

    return REWARD_OFFERS.filter(reward => {
      if (!reward.isActive) return false;
      
      // Check tier requirement
      if (reward.tierRequirement) {
        const requiredTierIndex = TIER_HIERARCHY.indexOf(reward.tierRequirement);
        if (userTierIndex < requiredTierIndex) return false;
      }
      
      return true;
    });
  };

  // Check if user can redeem a specific reward
  const canRedeem = (reward: RewardOffer) => {
    if (!profile) return false;
    
    const hasEnoughPoints = profile.points >= reward.pointsCost;
    const meetsRequirement = !reward.tierRequirement || 
      canAccessTierReward(profile.tier, reward.tierRequirement);
    
    return hasEnoughPoints && meetsRequirement && reward.isActive;
  };

  // Helper function to check tier access
  const canAccessTierReward = (userTier: string, requiredTier: string) => {
    const TIER_HIERARCHY = ['bronze', 'silver', 'gold', 'platinum'];
    const userTierIndex = TIER_HIERARCHY.indexOf(userTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  };

  // Redeem a reward
  const redeemReward = async (reward: RewardOffer): Promise<RedemptionResult> => {
    if (!profile) {
      const result = { success: false, message: 'User not authenticated' };
      toast.error(result.message);
      return result;
    }

    if (!canRedeem(reward)) {
      const result = { success: false, message: 'Cannot redeem this reward' };
      toast.error(result.message);
      return result;
    }

    setIsRedeeming(true);

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId: reward.id,
          points: reward.pointsCost
        })
      });

      const result: RedemptionResult = await response.json();

      if (result.success) {
        // Update local points optimistically
        if (result.newBalance !== undefined) {
          updateLocalPoints(result.newBalance);
        }

        // Add to recent redemptions
        setRecentRedemptions(prev => [result, ...prev.slice(0, 4)]);

        // Show success message
        toast.success(`${reward.name} redeemed successfully!`, {
          description: result.redemptionCode ? `Code: ${result.redemptionCode}` : undefined
        });

        // Refresh data to ensure consistency
        setTimeout(() => refreshRewards(), 1000);
      } else {
        toast.error(result.message || 'Redemption failed');
      }

      return result;
    } catch (error) {
      console.error('Redemption error:', error);
      const result = { success: false, message: 'Network error during redemption' };
      toast.error(result.message);
      return result;
    } finally {
      setIsRedeeming(false);
    }
  };

  // Get rewards by category
  const getRewardsByCategory = (category: RewardOffer['category']) => {
    return getAvailableRewards().filter(reward => reward.category === category);
  };

  // Get featured rewards (highest value or tier-exclusive)
  const getFeaturedRewards = () => {
    return getAvailableRewards()
      .filter(reward => reward.tierRequirement || reward.pointsCost >= 500)
      .slice(0, 3);
  };

  return {
    // Data
    availableRewards: getAvailableRewards(),
    recentRedemptions,
    
    // State
    isRedeeming,
    
    // Actions
    redeemReward,
    canRedeem,
    
    // Utilities
    getRewardsByCategory,
    getFeaturedRewards,
    
    // Constants
    categories: ['food', 'discount', 'delivery', 'merchandise'] as const
  };
}