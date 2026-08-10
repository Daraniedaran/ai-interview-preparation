import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { 
  RiVideoChatLine, 
  RiStarLine, 
  RiTimeLine, 
  RiUser3Line,
  RiSearchLine
} from 'react-icons/ri'
import { useState } from 'react'

const AdminInterviewsPage = () => {
  const [search, setSearch] = useState('')

  const { data: interviewStats } = useQuery({
    queryKey: ['admin-interview-stats'],
    queryFn: adminService.getInterviewStats,
  })

  const { data: interviewsData, isLoading } = useQuery({
    queryKey: ['admin-interviews-list', search],
    queryFn: () => adminService.listInterviews({ search }),
  })

  // Backend returns { total_interviews, completed_interviews, completion_rate, avg_overall_score, avg_duration_minutes }
  const stats = interviewStats || {}

  // Backend returns { total, page, data: [...] }
  const interviews = interviewsData?.data || []

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiVideoChatLine className="text-primary-600" /> AI Mock Interview Audits & Stats
        </h1>
        <p className="page-subtitle">Inspect completed AI mock interview sessions, feedback accuracy, and overall score averages</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 dark:bg-primary-900/30 text-primary-600">
            <RiVideoChatLine />
          </div>
          <div>
            <div className="stat-value">{stats.total_interviews ?? 0}</div>
            <div className="stat-label">Total Conducted Sessions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success-100 dark:bg-success-900/30 text-success-600">
            <RiStarLine />
          </div>
          <div>
            <div className="stat-value">{stats.avg_overall_score != null ? `${stats.avg_overall_score}%` : '—'}</div>
            <div className="stat-label">Average Student Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600">
            <RiTimeLine />
          </div>
          <div>
            <div className="stat-value">{stats.avg_duration_minutes != null ? `${stats.avg_duration_minutes} min` : '—'}</div>
            <div className="stat-label">Avg Duration · {stats.completion_rate ?? 0}% Completed</div>
          </div>
        </div>
      </div>

      {/* Interviews Audit Table */}
      <div className="card space-y-4">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interview logs by candidate name..."
            className="input pl-10"
          />
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Interview Type</th>
                <th>Target Company</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-4">
                      <div className="h-6 skeleton" />
                    </td>
                  </tr>
                ))
              ) : interviews.length > 0 ? (
                interviews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar w-8 h-8 text-xs"><RiUser3Line /></div>
                        <span className="font-semibold">{item.candidate}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {item.type ? item.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '—'}
                        {item.difficulty ? ` · ${item.difficulty}` : ''}
                      </span>
                    </td>
                    <td>
                      {item.company ? (
                        <span className="badge badge-primary">{item.company}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {item.score != null ? `${item.score}%` : <span className="text-gray-400 text-xs font-normal">pending</span>}
                    </td>
                    <td className="text-xs text-gray-400 font-mono">{formatDate(item.date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <RiVideoChatLine className="text-5xl mx-auto mb-2 opacity-30" />
                    No interview sessions found.
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

export default AdminInterviewsPage
