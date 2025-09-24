'use client';

import React from 'react';
import { FaStar, FaCrown, FaGem, FaGift, FaTruck, FaUtensils, FaTshirt } from 'react-icons/fa';
import { Sparkles, Zap, Gift } from 'lucide-react';

interface RewardOffer {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'food' | 'discount' | 'delivery' | 'merchandise';
  imageUrl?: string;
  isActive: boolean;
  tierRequirement?: 'bronze' | 'silver' | 'gold';
  cogsValue: number;
  rewardType: 'free_item' | 'discount' | 'delivery_credit' | 'merchandise';
}

interface RewardCardProps {
  reward: RewardOffer;
  userPoints: number;
  onSelect: () => void;
  userTier: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'food':
      return <FaUtensils className="text-2xl" />;
    case 'discount':
      return <Sparkles className="w-6 h-6" />;
    case 'delivery':
      return <FaTruck className="text-2xl" />;
    case 'merchandise':
      return <FaTshirt className="text-2xl" />;
    default:
      return <FaGift className="text-2xl" />;
  }
};

const getTierIcon = (tier?: string) => {
  switch (tier) {
    case 'gold':
      return <FaCrown className="text-lg text-[#FFD700]" />;
    case 'silver':
      return <FaGem className="text-lg text-gray-400" />;
    case 'bronze':
      return <FaStar className="text-lg text-[#CD7F32]" />;
    default:
      return null;
  }
};

const getTierColor = (tier?: string) => {
  switch (tier) {
    case 'gold':
      return 'from-[#FFD700]/20 to-[#FFA500]/20';
    case 'silver':
      return 'from-gray-400/20 to-gray-300/20';
    case 'bronze':
      return 'from-[#CD7F32]/20 to-[#B8860B]/20';
    default:
      return 'from-[#40E0D0]/20 to-[#20B2AA]/20';
  }
};

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onSelect, userTier }) => {
  const canAfford = userPoints >= reward.pointsCost;
  const hasRequiredTier = !reward.tierRequirement || 
    (reward.tierRequirement === 'bronze') ||
    (reward.tierRequirement === 'silver' && ['silver', 'gold'].includes(userTier)) ||
    (reward.tierRequirement === 'gold' && userTier === 'gold');
  
  const isAvailable = reward.isActive && canAfford && hasRequiredTier;

  return (
    <div className={`group relative bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer overflow-hidden ${
      isAvailable 
        ? 'border-[#40E0D0]/30 hover:border-[#40E0D0]/60 hover:shadow-2xl hover:shadow-[#40E0D0]/20' 
        : 'border-gray-700/30 opacity-60 cursor-not-allowed'
    }`}
    onClick={isAvailable ? onSelect : undefined}
    >
      {/* Background Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getTierColor(reward.tierRequirement)} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Tier Badge */}
      {reward.tierRequirement && (
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          {getTierIcon(reward.tierRequirement)}
          <span className="text-xs font-bold text-white uppercase">{reward.tierRequirement}</span>
        </div>
      )}
      
      <div className="relative z-10">
        {/* Category Icon */}
        <div className={`mb-4 p-3 rounded-full w-fit ${
          isAvailable 
            ? 'bg-gradient-to-br from-[#40E0D0] to-[#20B2AA] text-white'
            : 'bg-gray-700 text-gray-400'
        }`}>
          {getCategoryIcon(reward.category)}
        </div>
        
        {/* Reward Image */}
        {reward.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img 
              src={reward.imageUrl} 
              alt={reward.name}
              className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        )}
        
        {/* Reward Info */}
        <div className="mb-4">
          <h3 className="text-xl font-black text-white mb-2 tracking-wide group-hover:text-[#40E0D0] transition-colors duration-300">
            {reward.name}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {reward.description}
          </p>
        </div>
        
        {/* Points Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              isAvailable 
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]'
                : 'bg-gray-700'
            }`}>
              <Zap className={`w-4 h-4 ${
                isAvailable ? 'text-black' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <div className={`text-lg font-black ${
                isAvailable ? 'text-[#FFD700]' : 'text-gray-400'
              }`}>
                {reward.pointsCost.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">points</div>
            </div>
          </div>
          
          {/* Action Button */}
          <button
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
              isAvailable
                ? 'bg-gradient-to-r from-[#40E0D0] to-[#20B2AA] text-white hover:shadow-lg hover:shadow-[#40E0D0]/50 transform hover:scale-110'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAvailable}
          >
            {!hasRequiredTier ? 'TIER LOCKED' :
             !canAfford ? 'NEED MORE' :
             !reward.isActive ? 'UNAVAILABLE' :
             'REDEEM'}
          </button>
        </div>
        
        {/* Availability Status */}
        {!canAfford && hasRequiredTier && reward.isActive && (
          <div className="mt-3 text-center">
            <div className="text-xs text-red-400 font-semibold">
              Need {(reward.pointsCost - userPoints).toLocaleString()} more points
            </div>
          </div>
        )}
        
        {/* Special Effects for High-Value Rewards */}
        {reward.pointsCost >= 1000 && isAvailable && (
          <div className="absolute top-2 left-2">
            <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black px-2 py-1 rounded-full text-xs font-black animate-pulse">
              PREMIUM
            </div>
          </div>
        )}
        
        {/* Jackpot Effect for Very High-Value Rewards */}
        {reward.pointsCost >= 2000 && isAvailable && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardCard;