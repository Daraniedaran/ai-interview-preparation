import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../services'
import { motion } from 'framer-motion'
import { 
  RiLineChartLine, 
  RiBrainLine, 
  RiCodeSSlashLine, 
  RiQuestionAnswerLine,
  RiCheckDoubleLine,
  RiAlertLine
} from 'react-icons/ri'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const ProgressPage = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  })

  const { data: activity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardService.getActivity(30),
  })

  const { data: charts } = useQuery({
    queryKey: ['performance-charts'],
    queryFn: dashboardService.getPerformanceCharts,
  })

  // Backend shapes:
  // stats  -> { user, stats: { total_points, global_rank, coding_solved, tests_taken,
  //            interviews_completed, resume_score, aptitude_score, coding_score,
  //            interview_score, streak_days }, achievements, unread_notifications }
  // activity -> { activity: { "YYYY-MM-DD": count, ... } }
  // charts -> { weekly_progress: [{week, coding, aptitude}], skill_distribution: {...},
  //             aptitude_by_category: [{category, avg_score}] }
  const s = stats?.stats || {}
  const activityMap = activity?.activity || {}
  const weekly = charts?.weekly_progress || []
  const skills = charts?.skill_distribution || {}
  const categoryBreakdown = charts?.aptitude_by_category || []

  const readiness = [s.aptitude_score, s.coding_score, s.interview_score, s.resume_score]
    .filter((v) => typeof v === 'number' && v > 0).length
    ? Math.round(
        [s.aptitude_score, s.coding_score, s.interview_score, s.resume_score]
          .filter((v) => typeof v === 'number')
          .reduce((a, b) => a + b, 0) / 4
      )
    : 0

  // Last 30 days activity line chart (problems solved + tests completed per day)
  const dayLabels = []
  const dayValues = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dayLabels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
    dayValues.push(activityMap[key] || 0)
  }
  const hasActivity = dayValues.some((v) => v > 0)

  const lineChartData = {
    labels: hasActivity ? dayLabels : [],
    datasets: [
      {
        label: 'Daily Activity (Problems + Tests)',
        data: hasActivity ? dayValues : [],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const categoryDoughnutData = {
    labels: categoryBreakdown.map((c) => c.category?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown'),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.avg_score || 0),
        backgroundColor: ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
        borderWidth: 0,
      },
    ],
  }

  const barChartData = {
    labels: weekly.map((w) => w.week),
    datasets: [
      {
        label: 'Coding Problems',
        data: weekly.map((w) => w.coding || 0),
        backgroundColor: '#2563EB',
        borderRadius: 8,
      },
      {
        label: 'Aptitude Tests',
        data: weekly.map((w) => w.aptitude || 0),
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
      },
    ],
  }

  // Derive strengths / focus areas from the skill distribution
  const skillEntries = Object.entries(skills).map(([name, value]) => ({ name, value: value || 0 }))
  const strengths = skillEntries.filter((sk) => sk.value >= 60).sort((a, b) => b.value - a.value)
  const focusAreas = skillEntries.filter((sk) => sk.value < 60).sort((a, b) => a.value - b.value)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiLineChartLine className="text-primary-600" /> Comprehensive Progress & Analytics
        </h1>
        <p className="page-subtitle">Track your score improvements, domain masteries, and prep trajectory</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 dark:bg-primary-900/30 text-primary-600">
            <RiBrainLine />
          </div>
          <div>
            <div className="stat-value">{s.aptitude_score ? `${s.aptitude_score}%` : '—'}</div>
            <div className="stat-label">Aptitude Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success-100 dark:bg-success-900/30 text-success-600">
            <RiCodeSSlashLine />
          </div>
          <div>
            <div className="stat-value">{s.coding_solved ?? 0}</div>
            <div className="stat-label">Coding Problems Solved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-100 dark:bg-amber-900/30 text-amber-600">
            <RiQuestionAnswerLine />
          </div>
          <div>
            <div className="stat-value">{s.interviews_completed ?? 0}</div>
            <div className="stat-label">Mock Interviews Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600">
            <RiCheckDoubleLine />
          </div>
          <div>
            <div className="stat-value">{readiness ? `${readiness}/100` : '—'}</div>
            <div className="stat-label">Overall Readiness Score</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Line Chart */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Daily Prep Activity (Last 30 Days)
          </h3>
          {hasActivity ? (
            <div className="h-72">
              <Line 
                data={lineChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }} 
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">
              No activity recorded in the last 30 days. Solve problems or take tests to see your progress here.
            </p>
          )}
        </div>

        {/* Category Breakdown Doughnut */}
        <div className="card space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Domain Accuracy Breakdown
          </h3>
          {categoryBreakdown.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut 
                data={categoryDoughnutData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }} 
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">
              Complete aptitude tests to unlock your domain breakdown.
            </p>
          )}
        </div>
      </div>

      {/* Weekly Progress & Strength Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Weekly Progress (Last 8 Weeks)
          </h3>
          {weekly.length > 0 ? (
            <div className="h-60">
              <Bar 
                data={barChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }} 
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">
              No weekly data yet — start practicing to see your weekly trend.
            </p>
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Strengths & Focus Areas
          </h3>
          {skillEntries.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                <h4 className="text-sm font-bold text-success-700 dark:text-success-400 flex items-center gap-2">
                  <RiCheckDoubleLine /> Key Strengths
                </h4>
                {strengths.length > 0 ? (
                  <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                    {strengths.map((sk) => (
                      <li key={sk.name} className="flex justify-between">
                        <span>{sk.name}</span>
                        <span className="font-mono font-semibold">{sk.value}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Keep practicing — your scores will show up here.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <RiAlertLine /> Target Improvement Areas
                </h4>
                {focusAreas.length > 0 ? (
                  <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                    {focusAreas.map((sk) => (
                      <li key={sk.name} className="flex justify-between">
                        <span>{sk.name}</span>
                        <span className="font-mono font-semibold">{sk.value}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">No areas below 60% — excellent work!</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">
              Your skill profile will appear here once you complete assessments.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressPage
