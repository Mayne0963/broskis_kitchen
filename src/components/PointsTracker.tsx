'use client';

import React from 'react';
import { FaTrophy, FaStar, FaCrown, FaGem, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface PointsTrackerProps {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold';
  pointsToNextTier?: number;
  nextTier?: 'silver' | 'gold' | null;
  expiringPoints?: {
    amount: number;
    expiryDate: string;
  }[];
  totalLifetimePoints?: number;
}

const getTierInfo = (tier: string) => {
  switch (tier) {
    case 'gold':
      return {
        icon: <FaCrown className="text-2xl" />,
        color: '#FFD700',
        gradient: 'from-[#FFD700] to-[#FFA500]',
        bgGradient: 'from-[#FFD700]/20 to-[#FFA500]/20',
        name: 'GOLD ELITE',
        minPoints: 1000
      };
    case 'silver':
      return {
        icon: <FaGem className="text-2xl" />,
        color: '#C0C0C0',
        gradient: 'from-gray-300 to-gray-400',
        bgGradient: 'from-gray-300/20 to-gray-400/20',
        name: 'SILVER VIP',
        minPoints: 500
      };
    case 'bronze':
    default:
      return {
        icon: <FaStar className="text-2xl" />,
        color: '#CD7F32',
        gradient: 'from-[#CD7F32] to-[#B8860B]',
        bgGradient: 'from-[#CD7F32]/20 to-[#B8860B]/20',
        name: 'BRONZE MEMBER',
        minPoints: 0
      };
  }
};

const getNextTierInfo = (nextTier: string | null) => {
  if (!nextTier) return null;
  return getTierInfo(nextTier);
};

const PointsTracker: React.FC<PointsTrackerProps> = ({
  currentPoints,
  tier,
  pointsToNextTier,
  nextTier,
  expiringPoints = [],
  totalLifetimePoints = 0
}) => {
  const tierInfo = getTierInfo(tier);
  const nextTierInfo = getNextTierInfo(nextTier);
  
  // Calculate progress to next tier
  const progressPercentage = nextTier && pointsToNextTier 
    ? Math.max(0, Math.min(100, ((nextTierInfo!.minPoints - pointsToNextTier) / nextTierInfo!.minPoints) * 100))
    : 100;

  // Calculate total expiring points in next 7 days
  const expiringInWeek = expiringPoints
    .filter(exp => {
      const expiryDate = new Date(exp.expiryDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return expiryDate <= weekFromNow;
    })
    .reduce((total, exp) => total + exp.amount, 0);

  return (
    <div className="bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm border border-[#40E0D0]/20 rounded-3xl p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${tierInfo.bgGradient} rounded-3xl opacity-50`}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full bg-gradient-to-br ${tierInfo.gradient}`}>
              <div className="text-black">{tierInfo.icon}</div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wider">
                {tierInfo.name}
              </h2>
              <p className="text-gray-300 text-sm">Member Status</p>
            </div>
          </div>
          
          {/* Lifetime Points Badge */}
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Lifetime Earned</div>
            <div className="text-xl font-bold text-[#40E0D0]">
              {totalLifetimePoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Current Points Display */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div className="text-5xl font-black bg-gradient-to-r from-[#FFD700] to-[#40E0D0] bg-clip-text text-transparent">
              {currentPoints.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-300 text-lg font-semibold">Available Points</p>
        </div>

        {/* Tier Progress */}
        {nextTier && pointsToNextTier && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#40E0D0]" />
                <span className="text-white font-bold">Progress to {nextTierInfo!.name}</span>
              </div>
              <span className="text-[#40E0D0] font-bold">
                {pointsToNextTier.toLocaleString()} points needed
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${nextTierInfo!.gradient} transition-all duration-1000 ease-out relative`}
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Percentage */}
              <div className="absolute right-0 -top-8 text-sm font-bold text-[#40E0D0]">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>
        )}

        {/* Expiring Points Warning */}
        {expiringInWeek > 0 && (
          <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span className="text-red-400 font-bold text-lg">Expiring Soon!</span>
            </div>
            <p className="text-red-300 mb-3">
              <span className="font-bold text-red-400">{expiringInWeek.toLocaleString()} points</span> will expire within 7 days.
            </p>
            <div className="text-sm text-red-300">
              Use them before they're gone!
            </div>
          </div>
        )}

        {/* Expiring Points Details */}
        {expiringPoints.length > 0 && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaClock className="text-gray-400" />
              <span className="text-gray-300 font-semibold">Point Expiry Schedule</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {expiringPoints.slice(0, 3).map((exp, index) => {
                const expiryDate = new Date(exp.expiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">
                      {exp.amount.toLocaleString()} points
                    </span>
                    <span className={`font-semibold ${
                      daysUntilExpiry <= 3 ? 'text-red-400' :
                      daysUntilExpiry <= 7 ? 'text-orange-400' :
                      'text-gray-400'
                    }`}>
                      {daysUntilExpiry <= 0 ? 'Expired' :
                       daysUntilExpiry === 1 ? 'Tomorrow' :
                       `${daysUntilExpiry} days`}
                    </span>
                  </div>
                );
              })}
              {expiringPoints.length > 3 && (
                <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-600">
                  +{expiringPoints.length - 3} more expiring
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tier Benefits Preview */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-[#40E0D0] font-bold text-lg">
              {tier === 'gold' ? '15%' : tier === 'silver' ? '10%' : '5%'}
            </div>
            <div className="text-xs text-gray-400">Bonus Points</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-[#FFD700] font-bold text-lg">
              {tier === 'gold' ? 'Daily' : tier === 'silver' ? 'Daily' : 'Daily'}
            </div>
            <div className="text-xs text-gray-400">Free Spins</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-green-400 font-bold text-lg">
              {tier === 'gold' ? 'VIP' : tier === 'silver' ? 'Priority' : 'Standard'}
            </div>
            <div className="text-xs text-gray-400">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsTracker;