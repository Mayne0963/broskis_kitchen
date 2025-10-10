"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Users,
  Gift,
  Crown,
  Star,
  Trophy,
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  MoreVertical
} from "lucide-react";
import { toast } from "sonner";

// Types
interface UserProfile {
  uid: string;
  email: string;
  profile: {
    points: number;
    lifetimePoints: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    createdAt: number;
    updatedAt: number;
  };
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  delta: number;
  type: string;
  description: string;
  createdAt: number;
  metadata?: any;
}

interface AdminAction {
  id: string;
  adminUid: string;
  adminEmail: string;
  targetUid: string;
  targetEmail: string;
  action: 'adjust_points' | 'tier_override' | 'account_flag';
  details: any;
  timestamp: number;
}

interface AnalyticsData {
  totalUsers: number;
  totalPointsIssued: number;
  totalRedemptions: number;
  tierDistribution: Record<string, number>;
  recentActivity: number;
  topRewards: Array<{ name: string; count: number; points: number }>;
}

// Tier configuration
const TIER_CONFIG = {
  bronze: { name: 'Bronze', color: 'text-amber-600', icon: Star },
  silver: { name: 'Silver', color: 'text-gray-400', icon: Trophy },
  gold: { name: 'Gold', color: 'text-yellow-400', icon: Crown },
  platinum: { name: 'Platinum', color: 'text-purple-400', icon: Sparkles }
};

// Preset point adjustment amounts
const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, -50, -100, -250];

export default function AdminRewardsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [auditLog, setAuditLog] = useState<AdminAction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'analytics' | 'audit'>('search');

  // Mock analytics data - in real app, this would come from API
  useEffect(() => {
    setAnalytics({
      totalUsers: 1247,
      totalPointsIssued: 156780,
      totalRedemptions: 892,
      tierDistribution: {
        bronze: 623,
        silver: 398,
        gold: 187,
        platinum: 39
      },
      recentActivity: 24,
      topRewards: [
        { name: 'Free Appetizer', count: 234, points: 58500 },
        { name: '10% Off', count: 189, points: 28350 },
        { name: 'Free Drink', count: 156, points: 15600 },
        { name: 'Free Entree', count: 98, points: 49000 },
        { name: '20% Off', count: 87, points: 26100 }
      ]
    });
  }, []);

  // Search for user
  const searchUser = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a user ID or email");
      return;
    }

    setIsSearching(true);
    try {
      const isEmail = searchQuery.includes('@');
      const params = new URLSearchParams();
      if (isEmail) {
        params.set('email', searchQuery);
      } else {
        params.set('userId', searchQuery);
      }

      const response = await fetch(`/api/admin/rewards?${params}`);
      const result = await response.json();

      if (result.success) {
        setSelectedUser(result.user);
        toast.success("User found successfully");
      } else {
        toast.error(result.message || "User not found");
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for user");
      setSelectedUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Adjust user points
  const adjustPoints = async (amount: number, reason?: string) => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }

    if (amount === 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsAdjusting(true);
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          targetUserId: selectedUser.uid,
          points: amount,
          reason: reason || adjustmentReason || 'Admin adjustment'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update selected user's points
        setSelectedUser(prev => prev ? {
          ...prev,
          profile: {
            ...prev.profile,
            points: result.newBalance
          }
        } : null);

        toast.success(`Points ${amount > 0 ? 'added' : 'deducted'} successfully`);
        setCustomAmount("");
        setAdjustmentReason("");

        // Add to audit log
        const newAction: AdminAction = {
          id: Date.now().toString(),
          adminUid: 'current-admin',
          adminEmail: 'admin@broskiskitchen.com',
          targetUid: selectedUser.uid,
          targetEmail: selectedUser.email,
          action: 'adjust_points',
          details: { amount, reason: reason || adjustmentReason, newBalance: result.newBalance },
          timestamp: Date.now()
        };
        setAuditLog(prev => [newAction, ...prev]);
      } else {
        toast.error(result.message || "Failed to adjust points");
      }
    } catch (error) {
      console.error("Adjustment error:", error);
      toast.error("Failed to adjust points");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle custom amount adjustment
  const handleCustomAdjustment = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount)) {
      toast.error("Please enter a valid number");
      return;
    }
    adjustPoints(amount);
  };

  // Export analytics data
  const exportAnalytics = () => {
    if (!analytics) return;

    const data = {
      exportDate: new Date().toISOString(),
      analytics,
      auditLog: auditLog.slice(0, 100) // Last 100 actions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rewards-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Analytics data exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rewards Administration</h1>
          <p className="text-white/70">Manage user rewards, view analytics, and audit actions</p>
        </div>
        <button
          onClick={exportAnalytics}
          className="btn-ghost flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        {[
          { id: 'search', label: 'User Search', icon: Search },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'audit', label: 'Audit Log', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* User Search */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Search User</h2>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter user ID or email address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <button
                  onClick={searchUser}
                  disabled={isSearching}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </button>
              </div>
            </div>

            {/* User Details */}
            {selectedUser && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">User Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-white/70">Email</label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-white/70">User ID</label>
                      <p className="font-mono text-sm">{selectedUser.uid}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/70">Current Points</label>
                        <p className="text-2xl font-bold text-yellow-400">
                          {selectedUser.profile.points.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-white/70">Lifetime Points</label>
                        <p className="text-xl font-semibold">
                          {selectedUser.profile.lifetimePoints.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Current Tier</label>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const tierConfig = TIER_CONFIG[selectedUser.profile.tier];
                          const Icon = tierConfig.icon;
                          return (
                            <>
                              <Icon className={`h-5 w-5 ${tierConfig.color}`} />
                              <span className={`font-semibold ${tierConfig.color}`}>
                                {tierConfig.name}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Member Since</label>
                      <p>{new Date(selectedUser.profile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Point Adjustment */}
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Adjust Points</h3>
                  </div>

                  {/* Preset Amounts */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {PRESET_AMOUNTS.map(amount => (
                      <button
                        key={amount}
                        onClick={() => adjustPoints(amount)}
                        disabled={isAdjusting}
                        className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${
                          amount > 0
                            ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400'
                            : 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400'
                        }`}
                      >
                        {amount > 0 ? '+' : ''}{amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-white/70">Custom Amount</label>
                      <input
                        type="number"
                        placeholder="Enter amount (use negative for deduction)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Reason</label>
                      <input
                        type="text"
                        placeholder="Reason for adjustment..."
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <button
                      onClick={handleCustomAdjustment}
                      disabled={isAdjusting || !customAmount}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {isAdjusting ? 'Adjusting...' : 'Apply Adjustment'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {selectedUser && selectedUser.recentTransactions.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-2">
                  {selectedUser.recentTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.delta > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.delta > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-white/60">
                            {new Date(transaction.createdAt).toLocaleString()}
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
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {analytics && (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="card bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Total Users</p>
                        <p className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Points Issued</p>
                        <p className="text-2xl font-bold">{analytics.totalPointsIssued.toLocaleString()}</p>
                      </div>
                      <Gift className="h-8 w-8 text-yellow-400" />
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Redemptions</p>
                        <p className="text-2xl font-bold">{analytics.totalRedemptions.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    </div>
                  </div>

                  <div className="card bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Recent Activity</p>
                        <p className="text-2xl font-bold">{analytics.recentActivity}</p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Tier Distribution */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Tier Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.tierDistribution).map(([tier, count]) => {
                      const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
                      const Icon = tierConfig.icon;
                      const percentage = (count / analytics.totalUsers) * 100;
                      
                      return (
                        <div key={tier} className="flex items-center gap-4">
                          <div className="flex items-center gap-2 w-20">
                            <Icon className={`h-4 w-4 ${tierConfig.color}`} />
                            <span className={`text-sm font-medium ${tierConfig.color}`}>
                              {tierConfig.name}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">{count} users</span>
                              <span className="text-sm text-white/70">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${tierConfig.color.replace('text-', 'from-').replace('-400', '-400').replace('-600', '-600')} to-current`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Rewards */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Most Popular Rewards</h3>
                  <div className="space-y-3">
                    {analytics.topRewards.map((reward, index) => (
                      <div key={reward.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-yellow-400">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{reward.name}</p>
                            <p className="text-sm text-white/60">{reward.count} redemptions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-yellow-400">{reward.points.toLocaleString()}</p>
                          <p className="text-sm text-white/60">total points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Admin Action Log</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/60">Last 100 actions</span>
                </div>
              </div>

              {auditLog.length > 0 ? (
                <div className="space-y-3">
                  {auditLog.map(action => (
                    <div key={action.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-full">
                            <User className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {action.adminEmail} adjusted points for {action.targetEmail}
                            </p>
                            <p className="text-sm text-white/70">
                              {action.details.amount > 0 ? 'Added' : 'Deducted'} {Math.abs(action.details.amount)} points
                              {action.details.reason && ` - ${action.details.reason}`}
                            </p>
                            <p className="text-xs text-white/50 mt-1">
                              {new Date(action.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          action.details.amount > 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {action.details.amount > 0 ? '+' : ''}{action.details.amount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No admin actions recorded yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}