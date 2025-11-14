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

// Import new design system components
import { Container } from "@/components/atoms/Grid"
import { Typography } from "@/components/atoms/Typography"
import { Button } from "@/components/atoms/Button"
import { Card } from "@/components/atoms/Card"
import { Grid, Stack } from "@/components/atoms/Grid"
import { Badge } from "@/components/atoms/Badge"

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

// Tier configuration with design system colors
const TIER_CONFIG = {
  bronze: { 
    name: 'Bronze', 
    threshold: 0, 
    color: 'from-[var(--color-status-warning)] to-[var(--color-status-warning-dark)]', 
    icon: Star,
    badgeVariant: 'warning' as const
  },
  silver: { 
    name: 'Silver', 
    threshold: 500, 
    color: 'from-[var(--color-text-secondary)] to-[var(--color-text-tertiary)]', 
    icon: Trophy,
    badgeVariant: 'secondary' as const
  },
  gold: { 
    name: 'Gold', 
    threshold: 1500, 
    color: 'from-[var(--color-brand-gold)] to-[var(--color-brand-gold-light)]', 
    icon: Crown,
    badgeVariant: 'gold' as const
  },
  platinum: { 
    name: 'Platinum', 
    threshold: 3000, 
    color: 'from-[var(--color-brand-burgundy)] to-[var(--color-brand-burgundy-light)]', 
    icon: Sparkles,
    badgeVariant: 'primary' as const
  }
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
      <Container className="max-w-3xl py-8">
        <Card>
          <Card.Content>
            <Stack direction="column" gap="md">
              <Typography variant="h4">Oops! Something went wrong</Typography>
              <Typography variant="body" className="text-[var(--color-text-secondary)]">
                {unauth
                  ? "Please sign in to view your rewards."
                  : "We couldn't load your rewards right now. Please try again."}
              </Typography>
              <Stack direction="row" gap="md">
                <Button variant="primary" onClick={() => location.reload()}>Try Again</Button>
                {unauth && <Button variant="ghost" href="/login">Go to Login</Button>}
              </Stack>
            </Stack>
          </Card.Content>
        </Card>
      </Container>
    );
  }

  const { profile, transactions = [] }: { profile: RewardsProfile; transactions: Transaction[] } = state;
  const tierProgress = calculateTierProgress(profile);
  const currentTierConfig = TIER_CONFIG[profile.tier];
  const TierIcon = currentTierConfig.icon;

  return (
    <Container className="max-w-6xl py-8">
      <Stack direction="column" gap="xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <Typography variant="hero" className="bg-gradient-to-r from-[var(--color-brand-gold)] to-[var(--color-brand-gold-light)] bg-clip-text text-transparent">
            Broski's Rewards
          </Typography>
          <Typography variant="h5" className="text-[var(--color-text-secondary)]">
            Earn points, unlock rewards, and level up your dining experience
          </Typography>
        </motion.div>

        {/* Points & Tier Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Grid cols={1} md={3} gap="lg">
            {/* Current Points */}
            <Card variant="elevated" className="bg-gradient-to-br from-[var(--color-brand-gold-transparent)] to-[var(--color-brand-gold-light-transparent)] border-[var(--color-brand-gold)]/30">
              <Card.Content>
                <Stack direction="row" gap="md" alignment="center" justify="between">
                  <Stack direction="column" gap="xs">
                    <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">Available Points</Typography>
                    <Typography variant="h3" className="text-[var(--color-brand-gold)]">{profile.points.toLocaleString()}</Typography>
                  </Stack>
                  <Gift className="h-8 w-8 text-[var(--color-brand-gold)]" />
                </Stack>
              </Card.Content>
            </Card>

            {/* Lifetime Points */}
            <Card variant="elevated" className="bg-gradient-to-br from-[var(--color-status-info-transparent)] to-[var(--color-status-info-light-transparent)] border-[var(--color-status-info)]/30">
              <Card.Content>
                <Stack direction="row" gap="md" alignment="center" justify="between">
                  <Stack direction="column" gap="xs">
                    <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">Lifetime Points</Typography>
                    <Typography variant="h3" className="text-[var(--color-status-info)]">{profile.lifetimePoints.toLocaleString()}</Typography>
                  </Stack>
                  <TrendingUp className="h-8 w-8 text-[var(--color-status-info)]" />
                </Stack>
              </Card.Content>
            </Card>

            {/* Current Tier */}
            <Card variant="elevated" className={`bg-gradient-to-br ${currentTierConfig.color}/20 border-current/30`}>
              <Card.Content>
                <Stack direction="row" gap="md" alignment="center" justify="between">
                  <Stack direction="column" gap="xs">
                    <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">Current Tier</Typography>
                    <Typography variant="h3">{currentTierConfig.name}</Typography>
                  </Stack>
                  <TierIcon className="h-8 w-8" />
                </Stack>
              </Card.Content>
            </Card>
          </Grid>
        </motion.div>

      {/* Tier Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <Card.Content>
            <Stack direction="row" gap="md" alignment="center" justify="between" className="mb-6">
              <Typography variant="h4">Tier Progress</Typography>
              {tierProgress.nextTierName && (
                <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">
                  {tierProgress.pointsToNext} points to {tierProgress.nextTierName}
                </Typography>
              )}
            </Stack>
            
            <Stack direction="column" gap="lg">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-[var(--color-background-subtle)] rounded-full h-3">
                  <motion.div 
                    className={`h-3 rounded-full bg-gradient-to-r ${currentTierConfig.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${tierProgress.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <Typography variant="body-sm">{currentTierConfig.name}</Typography>
                  {tierProgress.nextTierName && <Typography variant="body-sm">{tierProgress.nextTierName}</Typography>}
                </div>
              </div>

              {/* Tier Benefits */}
              <Grid cols={2} md={4} gap="md">
                {Object.entries(TIER_CONFIG).map(([key, tier]) => {
                  const isUnlocked = profile.lifetimePoints >= tier.threshold;
                  const Icon = tier.icon;
                  return (
                    <Card 
                      key={key}
                      variant={isUnlocked ? "elevated" : "minimal"}
                      className={`${isUnlocked ? `bg-gradient-to-br ${tier.color}/20 border-current/30` : 'opacity-60'}`}
                    >
                      <Card.Content className="text-center">
                        <Icon className={`h-5 w-5 mx-auto mb-2 ${isUnlocked ? '' : 'text-[var(--color-text-tertiary)]'}`} />
                        <Typography variant="body-sm" className={isUnlocked ? '' : 'text-[var(--color-text-tertiary)]'}>
                          {tier.name}
                        </Typography>
                        <Typography variant="body-xs" className={isUnlocked ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-tertiary)]'}>
                          {tier.threshold} pts
                        </Typography>
                      </Card.Content>
                    </Card>
                  );
                })}
              </Grid>
            </Stack>
          </Card.Content>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Grid cols={1} md={2} gap="lg">
          <Button
            variant="primary"
            onClick={() => setShowRedemptionModal(true)}
            startIcon={<Gift />}
            size="lg"
          >
            Redeem Rewards
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowReferralModal(true)}
            startIcon={<Users />}
            size="lg"
          >
            Refer Friends
          </Button>
        </Grid>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <Card.Content>
            <Stack direction="row" gap="md" alignment="center" className="mb-6">
              <Clock className="h-5 w-5 text-[var(--color-text-secondary)]" />
              <Typography variant="h4">Recent Activity</Typography>
            </Stack>
            
            <Stack direction="column" gap="md">
              {transactions.slice(0, 5).map((transaction) => (
                <Card key={transaction.id} variant="minimal" className="bg-[var(--color-background-subtle)]">
                  <Card.Content>
                    <Stack direction="row" gap="md" alignment="center" justify="between">
                      <Stack direction="row" gap="md" alignment="center">
                        <div className={`p-2 rounded-full ${
                          transaction.delta > 0 ? 'bg-[var(--color-status-success-transparent)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-error-transparent)] text-[var(--color-status-error)]'
                        }`}>
                          {transaction.delta > 0 ? <TrendingUp className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                        </div>
                        <Stack direction="column" gap="xs">
                          <Typography variant="body">{transaction.description}</Typography>
                          <Typography variant="body-xs" className="text-[var(--color-text-secondary)]">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography variant="h6" className={
                        transaction.delta > 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'
                      }>
                        {transaction.delta > 0 ? '+' : ''}{transaction.delta}
                      </Typography>
                    </Stack>
                  </Card.Content>
                </Card>
              ))}
              
              {transactions.length === 0 && (
                <Card variant="minimal" className="text-center py-8">
                  <Card.Content>
                    <Stack direction="column" gap="md" alignment="center">
                      <Clock className="h-12 w-12 text-[var(--color-text-tertiary)]" />
                      <Typography variant="body" className="text-[var(--color-text-secondary)]">
                        No transactions yet. Start earning points with your first order!
                      </Typography>
                    </Stack>
                  </Card.Content>
                </Card>
              )}
            </Stack>
          </Card.Content>
        </Card>
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
              className="bg-[var(--color-background-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Stack direction="row" gap="md" alignment="center" justify="between" className="mb-6">
                <Typography variant="h3">Redeem Rewards</Typography>
                <Button
                  variant="ghost"
                  onClick={() => setShowRedemptionModal(false)}
                  size="sm"
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </Stack>

              <Grid cols={1} md={2} lg={3} gap="md">
                {REWARD_OFFERS.filter(reward => reward.isActive).map((reward) => {
                  const canRedeem = profile.points >= reward.pointsCost;
                  const tierMet = !reward.tierRequirement || 
                    TIER_CONFIG[profile.tier].threshold >= TIER_CONFIG[reward.tierRequirement].threshold;

                  return (
                    <Card
                      key={reward.id}
                      variant={canRedeem && tierMet ? "elevated" : "minimal"}
                      className={`transition-all cursor-pointer ${
                        canRedeem && tierMet
                          ? 'bg-[var(--color-brand-gold-transparent)] border-[var(--color-brand-gold)]/50 hover:bg-[var(--color-brand-gold-light-transparent)]'
                          : 'opacity-60'
                      }`}
                      onClick={() => {
                        if (canRedeem && tierMet) {
                          setSelectedReward(reward);
                        }
                      }}
                    >
                      <Card.Content>
                        <Stack direction="row" gap="md" alignment="start" justify="between" className="mb-3">
                          <Typography variant="h6" className="flex-1">{reward.name}</Typography>
                          <Badge variant="gold">{reward.pointsCost}</Badge>
                        </Stack>
                        <Typography variant="body-sm" className="text-[var(--color-text-secondary)] mb-3">{reward.description}</Typography>
                        
                        {reward.tierRequirement && (
                          <Stack direction="row" gap="xs" alignment="center" className="mb-3">
                            <Crown className="h-3 w-3 text-[var(--color-brand-gold)]" />
                            <Typography variant="body-xs" className="text-[var(--color-text-secondary)]">
                              {TIER_CONFIG[reward.tierRequirement].name}+ required
                            </Typography>
                          </Stack>
                        )}
                        
                        <Stack direction="row" gap="md" alignment="center" justify="between">
                          <Badge 
                            variant={
                              reward.category === 'food' ? 'success' :
                              reward.category === 'discount' ? 'info' :
                              'primary'
                            }
                            size="sm"
                          >
                            {reward.category}
                          </Badge>
                          
                          {canRedeem && tierMet && (
                            <ChevronRight className="h-4 w-4 text-[var(--color-brand-gold)]" />
                          )}
                        </Stack>
                      </Card.Content>
                    </Card>
                  );
                })}
              </Grid>

              {/* Confirmation Dialog */}
              {selectedReward && (
                <Card variant="elevated" className="mt-6 bg-[var(--color-brand-gold-transparent)] border-[var(--color-brand-gold)]/30">
                  <Card.Content>
                    <Typography variant="h5" className="mb-3">Confirm Redemption</Typography>
                    <Typography variant="body" className="text-[var(--color-text-secondary)] mb-4">
                      Redeem <strong>{selectedReward.name}</strong> for <strong>{selectedReward.pointsCost} points</strong>?
                    </Typography>
                    <Grid cols={2} gap="md">
                      <Button
                        onClick={() => handleRedeem(selectedReward)}
                        disabled={isRedeeming}
                        variant="primary"
                        className="w-full"
                      >
                        {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                      </Button>
                      <Button
                        onClick={() => setSelectedReward(null)}
                        variant="ghost"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </Grid>
                  </Card.Content>
                </Card>
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
              className="bg-[var(--color-background-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Stack direction="row" gap="md" alignment="center" justify="between" className="mb-6">
                <Typography variant="h3">Refer Friends</Typography>
                <Button
                  variant="ghost"
                  onClick={() => setShowReferralModal(false)}
                  size="sm"
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </Stack>

              <Stack direction="column" gap="lg" alignment="center">
                <Card variant="elevated" className="bg-gradient-to-br from-[var(--color-status-info-transparent)] to-[var(--color-status-info-light-transparent)] border-[var(--color-status-info)]/30">
                  <Card.Content className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 text-[var(--color-status-info)]" />
                    <Typography variant="h5" className="mb-2">Earn 200 Points</Typography>
                    <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">
                      For every friend you refer who makes their first order
                    </Typography>
                  </Card.Content>
                </Card>

                {profile.referralCode && (
                  <Stack direction="column" gap="md" className="w-full">
                    <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">Your referral code:</Typography>
                    <Card variant="minimal" className="bg-[var(--color-background-subtle)]">
                      <Card.Content>
                        <Stack direction="row" gap="md" alignment="center">
                          <code className="flex-1 text-center font-mono text-lg font-bold text-[var(--color-brand-gold)]">
                            {profile.referralCode}
                          </code>
                          <Button
                            variant="ghost"
                            onClick={copyReferralCode}
                            size="sm"
                            className="p-2"
                          >
                            {copiedReferral ? (
                              <Check className="h-4 w-4 text-[var(--color-status-success)]" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </Stack>
                      </Card.Content>
                    </Card>
                    
                    <Card variant="minimal" className="bg-[var(--color-background-subtle)]">
                      <Card.Content>
                        <Stack direction="row" gap="md" alignment="center" justify="center">
                          <QrCode className="h-5 w-5 text-[var(--color-text-secondary)]" />
                          <Typography variant="body-sm" className="text-[var(--color-text-secondary)]">QR Code coming soon</Typography>
                        </Stack>
                      </Card.Content>
                    </Card>
                  </Stack>
                )}

                <Stack direction="column" gap="xs" className="text-center">
                  <Typography variant="body-xs" className="text-[var(--color-text-secondary)]">• Your friend gets 100 points on their first order</Typography>
                  <Typography variant="body-xs" className="text-[var(--color-text-secondary)]">• You get 200 points when they complete their order</Typography>
                  <Typography variant="body-xs" className="text-[var(--color-text-secondary)]">• No limit on referrals!</Typography>
                </Stack>
              </Stack>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  </Container>
  );
}