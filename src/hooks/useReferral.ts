import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { useRewards } from './useRewards';

// Types
interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalPointsEarned: number;
  pendingReferrals: number;
}

interface ReferralData {
  success: boolean;
  referralCode?: string;
  referralStats?: ReferralStats;
  message?: string;
}

interface ReferralProcessResult {
  success: boolean;
  message: string;
  bonusAwarded?: boolean;
  referrerBonus?: number;
  newUserBonus?: number;
}

// Fetcher function
const fetcher = async (url: string): Promise<ReferralData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export function useReferral() {
  const { profile, refreshRewards } = useRewards();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch referral data
  const { data, error, isLoading, mutate } = useSWR<ReferralData>(
    '/api/rewards/referral',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      onError: (error) => {
        console.error('Referral fetch error:', error);
      }
    }
  );

  // Get referral code (fallback to profile if API fails)
  const referralCode = data?.referralCode || profile?.referralCode;

  // Get referral stats with defaults
  const referralStats: ReferralStats = data?.referralStats || {
    totalReferrals: 0,
    successfulReferrals: 0,
    totalPointsEarned: 0,
    pendingReferrals: 0
  };

  // Copy referral code to clipboard
  const copyReferralCode = async () => {
    if (!referralCode) {
      toast.error('No referral code available');
      return false;
    }

    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success('Referral code copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(false), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy referral code:', error);
      toast.error('Failed to copy referral code');
      return false;
    }
  };

  // Generate shareable referral link
  const getReferralLink = () => {
    if (!referralCode) return null;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/signup?ref=${referralCode}`;
  };

  // Generate referral message for sharing
  const getReferralMessage = () => {
    const link = getReferralLink();
    if (!link) return null;

    return `Hey! I'm loving Broski's Kitchen and thought you'd enjoy it too! Use my referral code "${referralCode}" when you sign up and we'll both get bonus points! ${link}`;
  };

  // Process referral bonus (called when a referred user makes their first order)
  const processReferralBonus = async (orderId: string, usedReferralCode?: string): Promise<ReferralProcessResult> => {
    const codeToUse = usedReferralCode || referralCode;
    
    if (!codeToUse || !orderId) {
      const result = { success: false, message: 'Missing referral code or order ID' };
      toast.error(result.message);
      return result;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/rewards/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode: codeToUse,
          orderId
        })
      });

      const result: ReferralProcessResult = await response.json();

      if (result.success) {
        toast.success('Referral bonus processed!', {
          description: result.bonusAwarded 
            ? `You earned ${result.newUserBonus || result.referrerBonus} bonus points!`
            : undefined
        });

        // Refresh both referral data and rewards
        mutate();
        refreshRewards();
      } else {
        // Don't show error toast for expected failures (like already processed)
        if (!result.message.includes('already processed')) {
          toast.error(result.message || 'Failed to process referral bonus');
        }
      }

      return result;
    } catch (error) {
      console.error('Process referral error:', error);
      const result = { success: false, message: 'Network error processing referral' };
      toast.error(result.message);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  // Share referral via Web Share API (if available)
  const shareReferral = async () => {
    const message = getReferralMessage();
    const link = getReferralLink();
    
    if (!message || !link) {
      toast.error('Unable to generate referral link');
      return false;
    }

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Broski's Kitchen!",
          text: message,
          url: link
        });
        return true;
      } catch (error) {
        // User cancelled or error occurred, fall back to copy
        console.log('Web Share cancelled or failed:', error);
      }
    }

    // Fallback to copying the message
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Referral message copied to clipboard!');
      return true;
    } catch (error) {
      toast.error('Failed to share referral');
      return false;
    }
  };

  // Calculate referral success rate
  const getSuccessRate = () => {
    if (referralStats.totalReferrals === 0) return 0;
    return Math.round((referralStats.successfulReferrals / referralStats.totalReferrals) * 100);
  };

  // Get referral tier based on successful referrals
  const getReferralTier = () => {
    const successful = referralStats.successfulReferrals;
    
    if (successful >= 50) return { name: 'Ambassador', color: 'text-purple-400', icon: '👑' };
    if (successful >= 25) return { name: 'Champion', color: 'text-yellow-400', icon: '🏆' };
    if (successful >= 10) return { name: 'Advocate', color: 'text-blue-400', icon: '⭐' };
    if (successful >= 5) return { name: 'Supporter', color: 'text-green-400', icon: '🌟' };
    return { name: 'Newcomer', color: 'text-gray-400', icon: '🚀' };
  };

  return {
    // Data
    referralCode,
    referralStats,
    referralLink: getReferralLink(),
    referralMessage: getReferralMessage(),
    
    // State
    isLoading,
    error,
    copiedCode,
    isProcessing,
    
    // Computed values
    successRate: getSuccessRate(),
    referralTier: getReferralTier(),
    
    // Actions
    copyReferralCode,
    shareReferral,
    processReferralBonus,
    refreshReferralData: mutate,
    
    // Constants
    bonusAmounts: {
      referrer: 200,
      newUser: 100
    }
  };
}