import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { leaderboardService } from '../../services'
import { motion } from 'framer-motion'
import { 
  RiTrophyLine, 
  RiMedalLine, 
  RiBuildingLine, 
  RiCalendarCheckLine,
  RiGlobalLine,
  RiSearchLine,
  RiUser3Line
} from 'react-icons/ri'

const LeaderboardPage = () => {
  const [tab, setTab] = useState('global')
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('')

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard', tab, collegeFilter],
    queryFn: () => {
      if (tab === 'weekly') return leaderboardService.weekly()
      if (tab === 'monthly') return leaderboardService.monthly()
      if (tab === 'college') return leaderboardService.college(collegeFilter || undefined)
      return leaderboardService.global()
    },
  })

  // Backend returns { data: [...], total, page, my_rank, my_points }
  const users = leaderboardData?.data || []
  const filteredUsers = users.filter((u) => 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.college || '').toLowerCase().includes(search.toLowerCase())
  )

  const userPoints = (u) => u.total_points ?? u.weekly_points ?? u.monthly_points ?? 0

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiTrophyLine className="text-amber-500" /> Leaderboard & Rankings
        </h1>
        <p className="page-subtitle">See where you stand among top performers across placement drives</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-dark-800 rounded-2xl w-fit">
          {[
            { id: 'global', label: 'Global', icon: RiGlobalLine },
            { id: 'weekly', label: 'Weekly', icon: RiCalendarCheckLine },
            { id: 'monthly', label: 'Monthly', icon: RiMedalLine },
            { id: 'college', label: 'College', icon: RiBuildingLine },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Icon /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={tab === 'college' ? collegeFilter : search}
            onChange={(e) => (tab === 'college' ? setCollegeFilter(e.target.value) : setSearch(e.target.value))}
            placeholder={tab === 'college' ? 'Filter by college name...' : 'Search student or college...'}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Podium Top 3 */}
      {filteredUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 pt-4 items-end max-w-2xl mx-auto">
          {/* 2nd Place */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card text-center p-4 border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-dark-800 dark:to-dark-900"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 mx-auto flex items-center justify-center font-bold text-lg mb-2 shadow">
              2
            </div>
            <div className="avatar mx-auto mb-2 w-12 h-12">
              {filteredUsers[1]?.profile_picture ? (
                <img src={filteredUsers[1].profile_picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <RiUser3Line className="text-xl" />
              )}
            </div>
            <h4 className="font-semibold text-sm truncate">{filteredUsers[1]?.full_name || 'Student'}</h4>
            <p className="text-xs text-gray-500 font-mono mt-1">{userPoints(filteredUsers[1])} pts</p>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="card text-center p-5 border-amber-300 dark:border-amber-600/40 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-dark-900 -translate-y-2 shadow-lg"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white mx-auto flex items-center justify-center font-bold text-xl mb-2 shadow-md">
              👑 1
            </div>
            <div className="avatar mx-auto mb-2 w-14 h-14 border-2 border-amber-400">
              {filteredUsers[0]?.profile_picture ? (
                <img src={filteredUsers[0].profile_picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <RiUser3Line className="text-2xl" />
              )}
            </div>
            <h4 className="font-bold text-base text-gray-900 dark:text-white truncate">{filteredUsers[0]?.full_name || 'Top Ranker'}</h4>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono mt-1">{userPoints(filteredUsers[0])} pts</p>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card text-center p-4 border-amber-700/30 bg-gradient-to-b from-amber-900/5 to-white dark:from-dark-800 dark:to-dark-900"
          >
            <div className="w-12 h-12 rounded-full bg-amber-800/20 text-amber-800 dark:text-amber-400 mx-auto flex items-center justify-center font-bold text-lg mb-2 shadow">
              3
            </div>
            <div className="avatar mx-auto mb-2 w-12 h-12">
              {filteredUsers[2]?.profile_picture ? (
                <img src={filteredUsers[2].profile_picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <RiUser3Line className="text-xl" />
              )}
            </div>
            <h4 className="font-semibold text-sm truncate">{filteredUsers[2]?.full_name || 'Student'}</h4>
            <p className="text-xs text-gray-500 font-mono mt-1">{userPoints(filteredUsers[2])} pts</p>
          </motion.div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th className="w-16 text-center">Rank</th>
                <th>Student</th>
                <th>College</th>
                <th className="text-center">Questions Solved</th>
                <th className="text-right">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-4">
                      <div className="h-6 skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id || idx}>
                    <td className="text-center font-bold">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {user.profile_picture ? (
                            <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{user.full_name || 'Anonymous Student'}</div>
                          <div className="text-xs text-gray-400">{user.username || user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{user.college || 'Universal Campus'}</span>
                    </td>
                    <td className="text-center font-mono text-sm">
                      {user.questions_solved ?? 0}
                    </td>
                    <td className="text-right font-mono font-bold text-primary-600 dark:text-primary-400">
                      {userPoints(user)} pts
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <RiTrophyLine className="text-5xl mx-auto mb-2 opacity-30" />
                    No leaderboard data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
