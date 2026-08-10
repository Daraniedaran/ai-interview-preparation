import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, RadarController, RadialLinearScale, Filler, Tooltip, Legend
} from 'chart.js'
import { Bar, Radar } from 'react-chartjs-2'
import {
  RiCodeLine, RiBrainLine, RiMicLine, RiFileTextLine,
  RiTrophyLine, RiFireLine, RiArrowRightLine, RiStarLine,
  RiBarChartLine, RiCalendarLine, RiUserLine
} from 'react-icons/ri'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  RadarController, RadialLinearScale, Filler, Tooltip, Legend)

const StatCard = ({ icon: Icon, label, value, color, link }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="stat-card"
  >
    <div className={`stat-icon ${color}`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
    {link && (
      <Link to={link} className="ml-auto btn-icon text-gray-400">
        <RiArrowRightLine />
      </Link>
    )}
  </motion.div>
)

const DashboardPage = () => {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  })

  const { data: charts } = useQuery({
    queryKey: ['performance-charts'],
    queryFn: dashboardService.getPerformanceCharts,
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardService.getRecentActivity(6),
  })

  const weeklyChartData = charts ? {
    labels: charts.weekly_progress?.map(w => w.week) || [],
    datasets: [
      {
        label: 'Coding Solved',
        data: charts.weekly_progress?.map(w => w.coding) || [],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Aptitude Tests',
        data: charts.weekly_progress?.map(w => w.aptitude) || [],
        backgroundColor: 'rgba(14, 165, 233, 0.7)',
        borderRadius: 6,
      },
    ],
  } : null

  const radarData = charts ? {
    labels: Object.keys(charts.skill_distribution || {}),
    datasets: [{
      label: 'Your Skills',
      data: Object.values(charts.skill_distribution || {}),
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      borderColor: 'rgba(37, 99, 235, 0.8)',
      pointBackgroundColor: '#2563EB',
      borderWidth: 2,
    }],
  } : null

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  }

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 skeleton" />
          ))}
        </div>
      </div>
    )
  }

  const s = stats?.stats || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Here's your progress overview</p>
        </div>
        <div className="flex items-center gap-2">
          {s.streak_days > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium">
              <RiFireLine />
              {s.streak_days} day streak
            </div>
          )}
          {s.global_rank && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
              <RiTrophyLine />
              Rank #{s.global_rank}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={RiCodeLine} label="Coding Solved" value={s.coding_solved} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" link="/coding" />
        <StatCard icon={RiBrainLine} label="Tests Taken" value={s.tests_taken} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" link="/aptitude" />
        <StatCard icon={RiMicLine} label="Interviews Done" value={s.interviews_completed} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" link="/interview" />
        <StatCard icon={RiTrophyLine} label="Total Points" value={s.total_points?.toLocaleString()} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" link="/leaderboard" />
      </div>

      {/* Scores Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aptitude Score', value: s.aptitude_score, color: 'primary', icon: RiBrainLine },
          { label: 'Coding Score', value: s.coding_score, color: 'secondary', icon: RiCodeLine },
          { label: 'Interview Score', value: s.interview_score, color: 'success', icon: RiMicLine },
          { label: 'Resume Score', value: s.resume_score, color: 'warning', icon: RiFileTextLine },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
              <Icon className={`text-${color}-600`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {value?.toFixed(0) || 0}<span className="text-sm text-gray-400">/100</span>
            </div>
            <div className="progress-bar h-2">
              <div className="progress-fill h-full" style={{ width: `${value || 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <RiBarChartLine className="text-primary-600" /> Weekly Activity
            </h3>
          </div>
          {weeklyChartData ? (
            <Bar data={weeklyChartData} options={chartOptions} height={180} />
          ) : (
            <div className="h-44 skeleton" />
          )}
        </div>

        {/* Skill Radar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <RiStarLine className="text-primary-600" /> Skill Distribution
            </h3>
          </div>
          {radarData ? (
            <Radar data={radarData} options={{
              responsive: true,
              scales: { r: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } } },
              plugins: { legend: { display: false } },
            }} height={180} />
          ) : (
            <div className="h-44 skeleton" />
          )}
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: RiBrainLine, label: 'Take Aptitude Test', link: '/aptitude', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
              { icon: RiCodeLine, label: 'Solve a Problem', link: '/coding', color: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
              { icon: RiMicLine, label: 'Mock Interview', link: '/interview', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
              { icon: RiFileTextLine, label: 'Resume Review', link: '/resume', color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' },
            ].map(({ icon: Icon, label, link, color }) => (
              <Link
                key={link}
                to={link}
                className={`p-4 rounded-xl ${color} hover:scale-105 transition-all duration-200 flex flex-col items-center gap-2 text-center`}
              >
                <Icon className="text-2xl" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Link to="/progress" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentActivity?.slice(0, 5).map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-lg">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.title}</p>
                  <p className="text-xs text-gray-400">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : ''}
                  </p>
                </div>
                {activity.status && (
                  <span className={`badge ${activity.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                    {activity.status}
                  </span>
                )}
              </div>
            ))}
            {!recentActivity?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No recent activity. Start practicing!</p>
            )}
          </div>
        </div>
      </div>

      {/* Achievements */}
      {stats?.achievements?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Achievements</h3>
            <Link to="/achievements" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.achievements.map((ach, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 dark:border-dark-700">
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ach.name}</p>
                  <p className="text-xs text-gray-400">{new Date(ach.earned_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
