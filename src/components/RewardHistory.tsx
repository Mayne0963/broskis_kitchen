'use client';

import React, { useState } from 'react';
import { FaPlus, FaMinus, FaGift, FaUtensils, FaTruck, FaTshirt, FaGamepad, FaShoppingCart, FaClock, FaFilter } from 'react-icons/fa';
import { Sparkles, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  amount: number;
  description: string;
  date: string;
  source?: 'order' | 'spin' | 'bonus' | 'redemption';
  orderId?: string;
  rewardName?: string;
  category?: 'food' | 'discount' | 'delivery' | 'merchandise';
}

interface RewardHistoryProps {
  history: HistoryItem[];
}

const getTransactionIcon = (item: HistoryItem) => {
  if (item.type === 'earned') {
    switch (item.source) {
      case 'order':
        return <FaShoppingCart className="text-lg" />;
      case 'spin':
        return <FaGamepad className="text-lg" />;
      case 'bonus':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <FaPlus className="text-lg" />;
    }
  } else if (item.type === 'redeemed') {
    switch (item.category) {
      case 'food':
        return <FaUtensils className="text-lg" />;
      case 'delivery':
        return <FaTruck className="text-lg" />;
      case 'merchandise':
        return <FaTshirt className="text-lg" />;
      default:
        return <FaGift className="text-lg" />;
    }
  } else if (item.type === 'expired') {
    return <FaClock className="text-lg" />;
  }
  return <Zap className="w-5 h-5" />;
};

const getTransactionColor = (item: HistoryItem) => {
  switch (item.type) {
    case 'earned':
      return item.source === 'spin' ? 'text-[#FFD700]' : 'text-green-400';
    case 'redeemed':
      return 'text-[#40E0D0]';
    case 'expired':
      return 'text-red-400';
    case 'bonus':
      return 'text-[#FFD700]';
    default:
      return 'text-gray-400';
  }
};

const getTransactionBg = (item: HistoryItem) => {
  switch (item.type) {
    case 'earned':
      return item.source === 'spin' 
        ? 'from-[#FFD700]/20 to-[#FFA500]/20 border-[#FFD700]/30'
        : 'from-green-500/20 to-green-400/20 border-green-400/30';
    case 'redeemed':
      return 'from-[#40E0D0]/20 to-[#20B2AA]/20 border-[#40E0D0]/30';
    case 'expired':
      return 'from-red-500/20 to-red-400/20 border-red-400/30';
    case 'bonus':
      return 'from-[#FFD700]/20 to-[#FFA500]/20 border-[#FFD700]/30';
    default:
      return 'from-gray-500/20 to-gray-400/20 border-gray-400/30';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const RewardHistory: React.FC<RewardHistoryProps> = ({ history }) => {
  const [filter, setFilter] = useState<'all' | 'earned' | 'redeemed' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  
  // Filter and sort history
  const filteredHistory = history
    .filter(item => filter === 'all' || item.type === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return Math.abs(b.amount) - Math.abs(a.amount);
      }
    });

  // Calculate summary stats
  const totalEarned = history
    .filter(item => item.type === 'earned')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const totalRedeemed = history
    .filter(item => item.type === 'redeemed')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  
  const totalExpired = history
    .filter(item => item.type === 'expired')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border border-green-400/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-green-400/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-green-400 font-semibold">Total Earned</span>
          </div>
          <div className="text-3xl font-black text-white">
            {totalEarned.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">points</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#40E0D0]/30 via-[#20B2AA]/20 to-[#40E0D0]/30 border border-[#40E0D0]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-[#40E0D0]/20">
              <FaGift className="text-lg text-[#40E0D0]" />
            </div>
            <span className="text-[#40E0D0] font-semibold">Total Redeemed</span>
          </div>
          <div className="text-3xl font-black text-white">
            {totalRedeemed.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">points</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-900/30 via-red-800/20 to-red-900/30 border border-red-400/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-400/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-400 font-semibold">Expired</span>
          </div>
          <div className="text-3xl font-black text-white">
            {totalExpired.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">points</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <span className="text-white font-semibold">Filter:</span>
            <div className="flex gap-2">
              {['all', 'earned', 'redeemed', 'expired'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as any)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    filter === filterType
                      ? 'bg-gradient-to-r from-[#40E0D0] to-[#20B2AA] text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-[#40E0D0] focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No transactions found</div>
            <div className="text-gray-500 text-sm">
              {filter === 'all' ? 'Start earning points by placing orders!' : `No ${filter} transactions yet.`}
            </div>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className={`group bg-gradient-to-r ${getTransactionBg(item)} backdrop-blur-sm border rounded-2xl p-6 hover:transform hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Transaction Icon */}
                  <div className={`p-3 rounded-full bg-black/20 ${getTransactionColor(item)}`}>
                    {getTransactionIcon(item)}
                  </div>
                  
                  {/* Transaction Details */}
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {item.description}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span>{formatDate(item.date)}</span>
                      {item.orderId && (
                        <span className="text-gray-400">Order #{item.orderId.slice(-6)}</span>
                      )}
                      {item.source && (
                        <span className="capitalize bg-gray-700/50 px-2 py-1 rounded-full text-xs">
                          {item.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Points Amount */}
                <div className="text-right">
                  <div className={`text-2xl font-black ${getTransactionColor(item)} flex items-center gap-1`}>
                    {item.type === 'earned' ? '+' : '-'}
                    {Math.abs(item.amount).toLocaleString()}
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    {item.type}
                  </div>
                </div>
              </div>
              
              {/* Additional Info for Redemptions */}
              {item.type === 'redeemed' && item.rewardName && (
                <div className="mt-4 pt-4 border-t border-gray-600/30">
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-400">Redeemed:</span> {item.rewardName}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Load More Button (if needed) */}
      {filteredHistory.length > 0 && filteredHistory.length >= 20 && (
        <div className="text-center">
          <button className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-500 transition-all duration-300 transform hover:scale-105">
            Load More History
          </button>
        </div>
      )}
    </div>
  );
};

export default RewardHistory;