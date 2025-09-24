'use client';

import React, { useState } from 'react';
import { FaTimes, FaGift, FaUtensils, FaTruck, FaTshirt, FaGamepad, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { Sparkles, Zap, Crown, AlertCircle } from 'lucide-react';

interface RewardOffer {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'food' | 'discount' | 'delivery' | 'merchandise';
  cogsValue: number;
  rewardType: 'discount' | 'free_item' | 'merchandise' | 'delivery_credit';
  requiredTier?: 'bronze' | 'silver' | 'gold';
  isActive: boolean;
  imageUrl?: string;
  terms?: string[];
}

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: RewardOffer | null;
  userPoints: number;
  userTier: 'bronze' | 'silver' | 'gold';
  onRedeem: (rewardId: string) => Promise<void>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'food':
      return <FaUtensils className="text-xl" />;
    case 'delivery':
      return <FaTruck className="text-xl" />;
    case 'merchandise':
      return <FaTshirt className="text-xl" />;
    default:
      return <FaGift className="text-xl" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'gold':
      return 'text-[#FFD700]';
    case 'silver':
      return 'text-gray-300';
    case 'bronze':
      return 'text-[#CD7F32]';
    default:
      return 'text-gray-400';
  }
};

const getTierRank = (tier: string): number => {
  switch (tier) {
    case 'bronze': return 1;
    case 'silver': return 2;
    case 'gold': return 3;
    default: return 0;
  }
};

const RedeemModal: React.FC<RedeemModalProps> = ({
  isOpen,
  onClose,
  reward,
  userPoints,
  userTier,
  onRedeem
}) => {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !reward) return null;

  const canAfford = userPoints >= reward.pointsCost;
  const meetsTierRequirement = !reward.requiredTier || 
    getTierRank(userTier) >= getTierRank(reward.requiredTier);
  const canRedeem = canAfford && meetsTierRequirement && reward.isActive;

  const handleRedeem = async () => {
    if (!canRedeem) return;
    
    setIsRedeeming(true);
    setRedeemStatus('idle');
    setErrorMessage('');
    
    try {
      await onRedeem(reward.id);
      setRedeemStatus('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setRedeemStatus('idle');
      }, 2000);
    } catch (error) {
      setRedeemStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Redemption failed');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleClose = () => {
    if (!isRedeeming) {
      onClose();
      setRedeemStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-700/50 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#40E0D0]/20 via-transparent to-[#FFD700]/20 rounded-3xl blur-xl" />
        
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-[#40E0D0]/20 to-[#20B2AA]/20">
                {getCategoryIcon(reward.category)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">REDEEM REWARD</h2>
                <div className="text-sm text-gray-400">Confirm your selection</div>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              disabled={isRedeeming}
              className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>

          {/* Reward Details */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/30 rounded-2xl p-6 mb-6">
            {/* Reward Image */}
            {reward.imageUrl && (
              <div className="mb-4">
                <img
                  src={reward.imageUrl}
                  alt={reward.name}
                  className="w-full h-32 object-cover rounded-xl"
                />
              </div>
            )}
            
            {/* Reward Info */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2">{reward.name}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{reward.description}</p>
            </div>
            
            {/* Points Cost */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Points Required:</span>
              <div className="flex items-center gap-1 text-2xl font-black text-[#FFD700]">
                {reward.pointsCost.toLocaleString()}
                <Zap className="w-5 h-5" />
              </div>
            </div>
            
            {/* Tier Requirement */}
            {reward.requiredTier && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Tier Required:</span>
                <div className={`flex items-center gap-1 font-bold ${getTierColor(reward.requiredTier)}`}>
                  <Crown className="w-4 h-4" />
                  {reward.requiredTier.toUpperCase()}
                </div>
              </div>
            )}
            
            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Category:</span>
              <span className="text-white font-semibold capitalize">{reward.category}</span>
            </div>
          </div>

          {/* Terms and Conditions */}
          {reward.terms && reward.terms.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Terms & Conditions</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-300">
                {reward.terms.map((term, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Messages */}
          {redeemStatus === 'success' && (
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-400/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-400 text-xl" />
                <div>
                  <div className="text-green-400 font-bold">Redemption Successful!</div>
                  <div className="text-sm text-gray-300">Your reward has been processed.</div>
                </div>
              </div>
            </div>
          )}

          {redeemStatus === 'error' && (
            <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-400/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-400 text-xl" />
                <div>
                  <div className="text-red-400 font-bold">Redemption Failed</div>
                  <div className="text-sm text-gray-300">{errorMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Messages */}
          {!canAfford && (
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-400/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-400" />
                <div className="text-red-400 font-semibold">
                  Insufficient points. You need {(reward.pointsCost - userPoints).toLocaleString()} more points.
                </div>
              </div>
            </div>
          )}

          {!meetsTierRequirement && (
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-600/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-yellow-400" />
                <div className="text-yellow-400 font-semibold">
                  {reward.requiredTier?.toUpperCase()} tier required. Upgrade your membership to unlock this reward.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={isRedeeming}
              className="flex-1 bg-gray-700 text-white py-4 rounded-xl font-bold hover:bg-gray-600 transition-all duration-300 disabled:opacity-50"
            >
              CANCEL
            </button>
            
            <button
              onClick={handleRedeem}
              disabled={!canRedeem || isRedeeming || redeemStatus === 'success'}
              className={`flex-1 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                canRedeem && redeemStatus !== 'success'
                  ? 'bg-gradient-to-r from-[#40E0D0] to-[#20B2AA] text-white hover:from-[#20B2AA] hover:to-[#40E0D0] transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isRedeeming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESSING...
                </>
              ) : redeemStatus === 'success' ? (
                <>
                  <FaCheckCircle />
                  REDEEMED
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  REDEEM NOW
                </>
              )}
            </button>
          </div>

          {/* Points Balance */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-400">Your Points Balance</div>
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-[#FFD700]">
              {userPoints.toLocaleString()}
              <Zap className="w-5 h-5" />
            </div>
            {canAfford && (
              <div className="text-sm text-gray-400 mt-1">
                After redemption: {(userPoints - reward.pointsCost).toLocaleString()} points
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemModal;