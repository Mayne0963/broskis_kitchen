"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Star, 
  Crown, 
  Zap, 
  Users, 
  QrCode, 
  Copy, 
  Check,
  Trophy,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  X
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

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

// Tier configuration
const TIER_CONFIG = {
  bronze: { name: 'Bronze', threshold: 0, color: 'from-amber-600 to-amber-800', icon: Star },
  silver: { name: 'Silver', threshold: 500, color: 'from-gray-400 to-gray-600', icon: Trophy },
  gold: { name: 'Gold', threshold: 1500, color: 'from-yellow-400 to-yellow-600', icon: Crown },
  platinum: { name: 'Platinum', threshold: 3000, color: 'from-purple-400 to-purple-600', icon: Sparkles }
};

// Sample reward offers
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
    id: 'broski_tshirt',
    name: "Broski's T-Shirt",
    description: 'Official Broski\'s Kitchen merchandise',
    pointsCost: 800,
    category: 'merchandise',
    isActive: true,
    tierRequirement: 'silver'
  }
];

export default function RewardsClient({ initial }: { initial: any }) {
  const [state, setState] = useState(initial);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardOffer | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // One retry on mount so devtools show precise API failure if any
  useEffect(() => {
    if (!initial?.ok) {
      (async () => {
        try {
          const r = await fetch("/api/rewards/me", { cache: "no-store" });
          const j = await r.json();
          setState(j);
          if (!j.ok) console.error("Rewards load failed:", j);
        } catch (e) {
          console.error("Rewards network error:", e);
        }
      })();
    }
  }, [initial]);

  // Trigger confetti for tier ups
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347']
    });
  };

  // Calculate tier progress
  const calculateTierProgress = (profile: RewardsProfile) => {
    const currentTier = TIER_CONFIG[profile.tier];
    const tiers = Object.entries(TIER_CONFIG);
    const currentIndex = tiers.findIndex(([key]) => key === profile.tier);
    const nextTier = tiers[currentIndex + 1];
    
    if (!nextTier) {
      return { progress: 100, pointsToNext: 0, nextTierName: null };
    }
    
    const pointsToNext = nextTier[1].threshold - profile.lifetimePoints;
    const progress = Math.min(100, (profile.lifetimePoints / nextTier[1].threshold) * 100);
    
    return { progress, pointsToNext, nextTierName: nextTier[1].name };
  };

  // Handle redemption
  const handleRedeem = async (reward: RewardOffer) => {
    if (!state?.profile || state.profile.points < reward.pointsCost) {
      toast.error("Insufficient points for this reward");
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          points: reward.pointsCost
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setState((prev: any) => ({
          ...prev,
          profile: {
            ...prev.profile,
            points: result.newBalance
          }
        }));

        // Show success with confetti
        triggerConfetti();
        toast.success(`Redeemed ${reward.name}! Code: ${result.redemptionCode}`);
        setShowRedemptionModal(false);
        setSelectedReward(null);
      } else {
        toast.error(result.message || "Redemption failed");
      }
    } catch (error) {
      toast.error("Network error during redemption");
    } finally {
      setIsRedeeming(false);
    }
  };

  // Copy referral code
  const copyReferralCode = async () => {
    if (!state?.profile?.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(state.profile.referralCode);
      setCopiedReferral(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch (error) {
      toast.error("Failed to copy referral code");
    }
  };

  if (!state?.ok) {
    const unauth = state?.reason === "unauthenticated";
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-1">Oops! Something went wrong</h2>
          <p className="text-white/70">
            {unauth
              ? "Please sign in to view your rewards."
              : "We couldn't load your rewards right now. Please try again."}
          </p>
          <div className="mt-4 flex gap-3">
            <button className="btn-primary" onClick={() => location.reload()}>Try Again</button>
            {unauth && <a className="btn-ghost underline" href="/login">Go to Login</a>}
          </div>
        </div>
      </div>
    );
  }

  const { profile, transactions = [] }: { profile: RewardsProfile; transactions: Transaction[] } = state;
  const tierProgress = calculateTierProgress(profile);
  const currentTierConfig = TIER_CONFIG[profile.tier];
  const TierIcon = currentTierConfig.icon;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Broski's Rewards
        </h1>
        <p className="text-white/70 text-lg">Earn points, unlock rewards, and level up your dining experience</p>
      </motion.div>

      {/* Points & Tier Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Current Points */}
        <div className="card bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Available Points</p>
              <p className="text-3xl font-bold text-yellow-400">{profile.points.toLocaleString()}</p>
            </div>
            <Gift className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        {/* Lifetime Points */}
        <div className="card bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Lifetime Points</p>
              <p className="text-3xl font-bold text-purple-400">{profile.lifetimePoints.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        {/* Current Tier */}
        <div className={`card bg-gradient-to-br ${currentTierConfig.color}/20 border-current/30`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Current Tier</p>
              <p className="text-2xl font-bold">{currentTierConfig.name}</p>
            </div>
            <TierIcon className="h-8 w-8" />
          </div>
        </div>
      </motion.div>

      {/* Tier Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tier Progress</h2>
          {tierProgress.nextTierName && (
            <span className="text-sm text-white/70">
              {tierProgress.pointsToNext} points to {tierProgress.nextTierName}
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-white/10 rounded-full h-3">
              <motion.div 
                className={`h-3 rounded-full bg-gradient-to-r ${currentTierConfig.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress.progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-white/70">
              <span>{currentTierConfig.name}</span>
              {tierProgress.nextTierName && <span>{tierProgress.nextTierName}</span>}
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Object.entries(TIER_CONFIG).map(([key, tier]) => {
              const isUnlocked = profile.lifetimePoints >= tier.threshold;
              const Icon = tier.icon;
              return (
                <div 
                  key={key}
                  className={`p-3 rounded-lg border ${
                    isUnlocked 
                      ? `bg-gradient-to-br ${tier.color}/20 border-current/30` 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${isUnlocked ? '' : 'text-white/30'}`} />
                  <p className={`text-sm font-medium ${isUnlocked ? '' : 'text-white/50'}`}>
                    {tier.name}
                  </p>
                  <p className={`text-xs ${isUnlocked ? 'text-white/70' : 'text-white/30'}`}>
                    {tier.threshold} pts
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <button
          onClick={() => setShowRedemptionModal(true)}
          className="btn-primary flex items-center justify-center gap-2 py-4"
        >
          <Gift className="h-5 w-5" />
          Redeem Rewards
        </button>
        
        <button
          onClick={() => setShowReferralModal(true)}
          className="btn-ghost flex items-center justify-center gap-2 py-4 border-2 border-white/20 hover:border-white/40"
        >
          <Users className="h-5 w-5" />
          Refer Friends
        </button>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transaction.delta > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.delta > 0 ? <TrendingUp className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-white/60">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`font-bold ${
                transaction.delta > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {transaction.delta > 0 ? '+' : ''}{transaction.delta}
              </div>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-white/60">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet. Start earning points with your first order!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Redemption Modal */}
      <AnimatePresence>
        {showRedemptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRedemptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border border-white/20 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Redeem Rewards</h3>
                <button
                  onClick={() => setShowRedemptionModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REWARD_OFFERS.filter(reward => reward.isActive).map((reward) => {
                  const canRedeem = profile.points >= reward.pointsCost;
                  const tierMet = !reward.tierRequirement || 
                    TIER_CONFIG[profile.tier].threshold >= TIER_CONFIG[reward.tierRequirement].threshold;

                  return (
                    <div
                      key={reward.id}
                      className={`p-4 rounded-lg border transition-all ${
                        canRedeem && tierMet
                          ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 cursor-pointer'
                          : 'border-white/20 bg-white/5 opacity-60'
                      }`}
                      onClick={() => {
                        if (canRedeem && tierMet) {
                          setSelectedReward(reward);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{reward.name}</h4>
                        <span className="text-yellow-400 font-bold">{reward.pointsCost}</span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{reward.description}</p>
                      
                      {reward.tierRequirement && (
                        <div className="flex items-center gap-1 mb-2">
                          <Crown className="h-3 w-3" />
                          <span className="text-xs text-white/60">
                            {TIER_CONFIG[reward.tierRequirement].name}+ required
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reward.category === 'food' ? 'bg-green-500/20 text-green-400' :
                          reward.category === 'discount' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {reward.category}
                        </span>
                        
                        {canRedeem && tierMet && (
                          <ChevronRight className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirmation Dialog */}
              {selectedReward && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Confirm Redemption</h4>
                  <p className="text-sm text-white/70 mb-4">
                    Redeem <strong>{selectedReward.name}</strong> for <strong>{selectedReward.pointsCost} points</strong>?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRedeem(selectedReward)}
                      disabled={isRedeeming}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                    </button>
                    <button
                      onClick={() => setSelectedReward(null)}
                      className="btn-ghost flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Referral Modal */}
      <AnimatePresence>
        {showReferralModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReferralModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border border-white/20 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Refer Friends</h3>
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                  <h4 className="font-semibold mb-2">Earn 200 Points</h4>
                  <p className="text-sm text-white/70">
                    For every friend you refer who makes their first order
                  </p>
                </div>

                {profile.referralCode && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/70">Your referral code:</p>
                    <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                      <code className="flex-1 text-center font-mono text-lg font-bold">
                        {profile.referralCode}
                      </code>
                      <button
                        onClick={copyReferralCode}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        {copiedReferral ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg">
                      <QrCode className="h-5 w-5" />
                      <span className="text-sm">QR Code coming soon</span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-white/60 space-y-1">
                  <p>• Your friend gets 100 points on their first order</p>
                  <p>• You get 200 points when they complete their order</p>
                  <p>• No limit on referrals!</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}