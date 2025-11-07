import useSWR from 'swr';
import { toast } from 'sonner';
import { authFetch } from '@/lib/utils/authFetch';

// Types
interface RewardsProfile {
  uid: string;
  points: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  referralCode?: string;
  createdAt: number;
  updatedAt: number;
}

interface Transaction {
  id: string;
  delta: number;
  type: string;
  description: string;
  createdAt: number;
  metadata?: any;
}

interface RewardsData {
  ok: boolean;
  profile?: RewardsProfile;
  transactions?: Transaction[];
  reason?: string;
}

// Fetcher function
const fetcher = async (url: string): Promise<RewardsData> => {
  const response = await authFetch(url, { cache: 'no-store', retryOn401: true });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Main useRewards hook
export function useRewards() {
  const { data, error, isLoading, mutate } = useSWR<RewardsData>(
    '/api/rewards/me',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error('Rewards fetch error:', error);
        toast.error('Failed to load rewards data');
      }
    }
  );

  // Calculate tier progress
  const calculateTierProgress = (profile: RewardsProfile) => {
    const TIER_THRESHOLDS = {
      bronze: 0,
      silver: 500,
      gold: 1500,
      platinum: 3000
    };

    const tiers = Object.entries(TIER_THRESHOLDS);
    const currentIndex = tiers.findIndex(([key]) => key === profile.tier);
    const nextTier = tiers[currentIndex + 1];
    
    if (!nextTier) {
      return { progress: 100, pointsToNext: 0, nextTierName: null };
    }
    
    const pointsToNext = nextTier[1] - profile.lifetimePoints;
    const progress = Math.min(100, (profile.lifetimePoints / nextTier[1]) * 100);
    
    return { 
      progress, 
      pointsToNext, 
      nextTierName: nextTier[0] as 'silver' | 'gold' | 'platinum'
    };
  };

  // Refresh rewards data
  const refreshRewards = () => {
    mutate();
  };

  // Update local state optimistically
  const updateLocalPoints = (newPoints: number) => {
    if (data?.profile) {
      mutate({
        ...data,
        profile: {
          ...data.profile,
          points: newPoints
        }
      }, false);
    }
  };

  return {
    // Data
    profile: data?.profile,
    transactions: data?.transactions || [],
    
    // State
    isLoading,
    error: error || (!data?.ok ? data?.reason : null),
    isAuthenticated: data?.ok === true,
    
    // Computed values
    tierProgress: data?.profile ? calculateTierProgress(data.profile) : null,
    
    // Actions
    refreshRewards,
    updateLocalPoints,
    
    // Raw data for advanced usage
    rawData: data
  };
}

// Hook for tier information
export function useTierInfo() {
  const TIER_CONFIG = {
    bronze: { 
      name: 'Bronze', 
      threshold: 0, 
      color: 'from-amber-600 to-amber-800',
      benefits: ['Earn 1 point per $1 spent', 'Birthday bonus points']
    },
    silver: { 
      name: 'Silver', 
      threshold: 500, 
      color: 'from-gray-400 to-gray-600',
      benefits: ['Earn 1.25 points per $1 spent', 'Exclusive silver rewards', 'Priority support']
    },
    gold: { 
      name: 'Gold', 
      threshold: 1500, 
      color: 'from-yellow-400 to-yellow-600',
      benefits: ['Earn 1.5 points per $1 spent', 'Free delivery on orders $25+', 'Early access to new items']
    },
    platinum: { 
      name: 'Platinum', 
      threshold: 3000, 
      color: 'from-purple-400 to-purple-600',
      benefits: ['Earn 2 points per $1 spent', 'VIP customer service', 'Exclusive platinum events']
    }
  };

  return {
    tiers: TIER_CONFIG,
    getTierByPoints: (points: number) => {
      const tierEntries = Object.entries(TIER_CONFIG);
      for (let i = tierEntries.length - 1; i >= 0; i--) {
        const [tierKey, tierData] = tierEntries[i];
        if (points >= tierData.threshold) {
          return { key: tierKey as keyof typeof TIER_CONFIG, ...tierData };
        }
      }
      return { key: 'bronze' as const, ...TIER_CONFIG.bronze };
    }
  };
}