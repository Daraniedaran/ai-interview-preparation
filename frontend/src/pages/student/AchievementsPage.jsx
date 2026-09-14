import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  RiAwardLine,
  RiLockLine,
  RiCheckLine,
  RiCopperCoinLine
} from 'react-icons/ri'
import api from '../../services/api'

const AchievementsPage = () => {
  const { data: achievementsData, isLoading, isError } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: () => api.get('/achievements/me').then(r => r.data),
    retry: false,
  })

  const achievements = achievementsData?.achievements || []
  const totalPoints = achievementsData?.total_points ?? 0
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiAwardLine className="text-amber-500" /> Badges & Achievements
          </h1>
          <p className="page-subtitle">Earn rewards and showcase your placement preparation milestones</p>
        </div>

        <div className="card py-3 px-5 flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-300 dark:border-amber-700/50">
          <RiCopperCoinLine className="text-3xl text-amber-500" />
          <div>
            <div className="text-xl font-bold font-mono text-gray-900 dark:text-white">{totalPoints} PTS</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Total Honor Points</div>
          </div>
        </div>
      </div>

      {/* Overview Progress Card */}
      <div className="card space-y-3">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-gray-700 dark:text-gray-300">Completion Progress</span>
          <span className="text-primary-600 font-mono">{unlockedCount} / {achievements.length} Unlocked ({Math.round((unlockedCount / achievements.length) * 100)}%)</span>
        </div>
        <div className="progress-bar h-3">
          <div 
            className="progress-fill h-full"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="h-10 w-10 skeleton rounded-xl" />
              <div className="h-4 skeleton w-3/4" />
              <div className="h-3 skeleton w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-12 text-gray-400">
          <RiAwardLine className="text-5xl mx-auto mb-2 opacity-30" />
          <p>Failed to load achievements. Please try again.</p>
        </div>
      ) : achievements.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <RiAwardLine className="text-5xl mx-auto mb-2 opacity-30" />
          <p>No achievements yet. Complete tests, solve problems, and attend interviews to earn badges.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((badge, idx) => (
          <motion.div
            key={badge.id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`card relative overflow-hidden transition-all duration-300 ${
              badge.unlocked 
                ? 'border-amber-200 dark:border-amber-900/40 bg-gradient-to-b from-amber-50/30 to-white dark:from-dark-800 dark:to-dark-900 shadow-sm hover:shadow-md' 
                : 'opacity-60 grayscale bg-gray-50 dark:bg-dark-900/40 border-dashed'
            }`}
          >
            {/* Status Icon */}
            <div className="absolute top-3 right-3">
              {badge.unlocked ? (
                <span className="w-6 h-6 rounded-full bg-success-100 dark:bg-success-900/40 text-success-600 flex items-center justify-center text-xs">
                  <RiCheckLine />
                </span>
              ) : (
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-dark-700 text-gray-500 flex items-center justify-center text-xs">
                  <RiLockLine />
                </span>
              )}
            </div>

            <div className="text-4xl mb-3">{badge.icon || '🏅'}</div>
            <div className="space-y-1">
              <span className="badge badge-gray text-[10px]">{badge.category}</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                {badge.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {badge.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700/60 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Reward</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">+{badge.points} PTS</span>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  )
}

export default AchievementsPage
