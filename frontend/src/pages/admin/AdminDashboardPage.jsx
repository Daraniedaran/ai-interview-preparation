import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { motion } from 'framer-motion'
import { 
  RiAdminLine, 
  RiGroupLine, 
  RiQuestionnaireLine, 
  RiCodeSSlashLine, 
  RiVideoChatLine,
  RiTimeLine,
  RiFileTextLine
} from 'react-icons/ri'
import { Link } from 'react-router-dom'

const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  })

  const { data: recentSubmissions } = useQuery({
    queryKey: ['admin-recent-submissions'],
    queryFn: () => adminService.getRecentSubmissions(5),
  })

  // Backend returns { overview: {...}, daily_active_users: [...] }
  const s = stats?.overview || {}

  const formatTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiAdminLine className="text-primary-600" /> Admin Command Center
          </h1>
          <p className="page-subtitle">Monitor platform metrics, user engagement, questions bank, and system activity</p>
        </div>

        <div className="flex gap-2">
          <Link to="/admin/users" className="btn btn-secondary text-xs">
            Manage Users
          </Link>
          <Link to="/admin/questions" className="btn btn-primary text-xs">
            Add Questions
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 dark:bg-primary-900/30 text-primary-600">
            <RiGroupLine />
          </div>
          <div>
            <div className="stat-value">{s.total_users ?? 0}</div>
            <div className="stat-label">Registered Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success-100 dark:bg-success-900/30 text-success-600">
            <RiVideoChatLine />
          </div>
          <div>
            <div className="stat-value">{s.total_interviews ?? 0}</div>
            <div className="stat-label">AI Mock Interviews</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-100 dark:bg-amber-900/30 text-amber-600">
            <RiCodeSSlashLine />
          </div>
          <div>
            <div className="stat-value">{s.total_submissions ?? 0}</div>
            <div className="stat-label">Code Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600">
            <RiQuestionnaireLine />
          </div>
          <div>
            <div className="stat-value">{s.total_questions ?? 0}</div>
            <div className="stat-label">Questions in Bank</div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Shortcuts */}
        <div className="card space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Administration Modules</h3>
          <div className="space-y-2">
            {[
              { title: 'User Management', desc: 'Manage student accounts, roles & status', path: '/admin/users', icon: RiGroupLine },
              { title: 'Aptitude & Theoretical Qs', desc: 'Create, edit & manage question bank', path: '/admin/questions', icon: RiQuestionnaireLine },
              { title: 'Coding Challenges Bank', desc: 'Add test cases & coding problems', path: '/admin/coding', icon: RiCodeSSlashLine },
              { title: 'Company Profiles', desc: 'Set company rounds & salary trends', path: '/admin/companies', icon: RiFileTextLine },
            ].map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="p-3 rounded-xl border border-gray-100 dark:border-dark-700 hover:border-primary-500 flex items-center gap-3 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center transition-all">
                    <Icon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{item.title}</h4>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent System Activity Log</h3>
            <span className="text-xs text-gray-400 flex items-center gap-1"><RiTimeLine /> Live Feed</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Action / Event</th>
                  <th>Language / Status</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions?.length > 0 ? (
                  recentSubmissions.map((sub, i) => (
                    <tr key={sub.id || i}>
                      <td className="font-semibold">{sub.user?.username || 'Student'}</td>
                      <td>{sub.problem?.title || 'Coding Challenge Submission'}</td>
                      <td>
                        <span className={`badge ${sub.status === 'accepted' ? 'badge-success' : 'badge-warning'}`}>
                          {sub.language || sub.status || '—'}
                        </span>
                      </td>
                      <td className="text-right font-mono text-xs text-gray-400">
                        {formatTime(sub.submitted_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="py-3"><div className="h-5 skeleton" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
