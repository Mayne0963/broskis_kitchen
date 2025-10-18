"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Gift, 
  Trophy, 
  Users, 
  Crown, 
  Star, 
  Heart, 
  Award,
  Zap,
  ChevronRight
} from 'lucide-react'

interface CommunityEvent {
  id: string
  type: 'birthday' | 'anniversary' | 'achievement'
  title: string
  description: string
  date: string
  reward?: string
  isActive: boolean
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  tier: string
  progress?: number
  maxProgress?: number
  isUnlocked: boolean
  unlockedAt?: string
}

interface CommunitySectionProps {
  userTier: string
  upcomingEvents: CommunityEvent[]
  achievements: Achievement[]
  onClaimBirthdaySpin?: () => void
  onNominateAchievement?: (achievementId: string) => void
}

const TIER_BADGES = {
  bronze: { color: 'from-amber-600 to-amber-800', icon: '🥉', label: 'Bronze' },
  silver: { color: 'from-gray-400 to-gray-600', icon: '🥈', label: 'Silver' },
  gold: { color: 'from-yellow-400 to-yellow-600', icon: '🥇', label: 'Gold' },
  platinum: { color: 'from-purple-400 to-purple-600', icon: '💎', label: 'Platinum' },
  senior: { color: 'from-emerald-400 to-emerald-600', icon: '👑', label: 'Senior' },
  volunteer: { color: 'from-blue-400 to-blue-600', icon: '🌟', label: 'Volunteer' }
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({
  userTier,
  upcomingEvents = [],
  achievements = [],
  onClaimBirthdaySpin,
  onNominateAchievement
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'achievements' | 'badges'>('events')

  const tierBadge = TIER_BADGES[userTier.toLowerCase() as keyof typeof TIER_BADGES] || TIER_BADGES.bronze

  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const availableAchievements = achievements.filter(a => !a.isUnlocked)

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-turquoise-400" />
          Community Hub
        </h2>
        <p className="text-gray-400">
          Connect with fellow Broskis and celebrate milestones together
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
        {[
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'badges', label: 'Badges', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-turquoise-400' : 'text-gray-500'}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Birthday/Anniversary Spins */}
            <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-700/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Gift className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-semibold text-white">Special Celebrations</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Celebrate your special days with free bonus spins! Birthday and anniversary spins are on us.
              </p>
              <button
                onClick={onClaimBirthdaySpin}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-400 hover:to-purple-400 transition-all duration-200 hover:scale-105"
              >
                <Calendar className="w-4 h-4" />
                Claim Birthday Spin
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Upcoming Events */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Upcoming Events
              </h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {event.type === 'birthday' && <Gift className="w-4 h-4 text-pink-400" />}
                            {event.type === 'anniversary' && <Heart className="w-4 h-4 text-red-400" />}
                            {event.type === 'achievement' && <Trophy className="w-4 h-4 text-yellow-400" />}
                            <h4 className="font-semibold text-white">{event.title}</h4>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                          <div className="text-xs text-gray-500">{event.date}</div>
                        </div>
                        {event.reward && (
                          <div className="text-sm text-turquoise-400 font-semibold">
                            {event.reward}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Unlocked Achievements ({unlockedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedAchievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-700/30 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{achievement.name}</h4>
                          <p className="text-sm text-gray-400">{achievement.description}</p>
                        </div>
                        <div className="text-xs text-yellow-400 font-semibold">
                          {achievement.tier}
                        </div>
                      </div>
                      {achievement.unlockedAt && (
                        <div className="text-xs text-gray-500">
                          Unlocked: {achievement.unlockedAt}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Achievements */}
            {availableAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gray-400" />
                  In Progress
                </h3>
                <div className="space-y-3">
                  {availableAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-xl opacity-50">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-300">{achievement.name}</h4>
                          <p className="text-sm text-gray-500">{achievement.description}</p>
                        </div>
                        <button
                          onClick={() => onNominateAchievement?.(achievement.id)}
                          className="px-3 py-1 bg-turquoise-600 text-white text-xs rounded-lg hover:bg-turquoise-500 transition-colors"
                        >
                          Nominate
                        </button>
                      </div>
                      
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-turquoise-400 to-turquoise-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>You haven&apos;t unlocked any achievements yet. Keep ordering to earn your first badge!</p>
              </div>
            )}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Current Tier Badge */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Your Current Tier
              </h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gradient-to-br ${tierBadge.color} p-6 rounded-lg text-center`}
              >
                <div className="text-4xl mb-2">{tierBadge.icon}</div>
                <h4 className="text-xl font-bold text-white mb-1">{tierBadge.label} Member</h4>
                <p className="text-sm opacity-90">
                  You&apos;re part of the exclusive {tierBadge.label.toLowerCase()} tier
                </p>
              </motion.div>
            </div>

            {/* Tier Benefits */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-turquoise-400" />
                Tier Benefits
              </h3>
              <div className="space-y-2">
                {userTier.toLowerCase() === 'senior' && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                    <Crown className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300">Reduced spin cost (5 points)</span>
                  </div>
                )}
                {userTier.toLowerCase() === 'volunteer' && (
                  <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <Star className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300">Exclusive volunteer rewards</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <Gift className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Daily spin wheel access</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Points for every order</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunitySection