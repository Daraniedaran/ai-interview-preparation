import { useQuery } from '@tanstack/react-query'
import {
  RiFileChartLine,
  RiDownloadCloudLine,
  RiPieChartLine,
  RiLineChartLine,
  RiCheckDoubleLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { adminService } from '../../services'

const downloadCSV = (filename, rows) => {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const AdminReportsPage = () => {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminService.getStats })
  const { data: qStats } = useQuery({ queryKey: ['admin-question-stats'], queryFn: adminService.getQuestionStats })
  const { data: iStats } = useQuery({ queryKey: ['admin-interview-stats'], queryFn: adminService.getInterviewStats })
  const { data: recent } = useQuery({ queryKey: ['admin-recent-subs'], queryFn: () => adminService.getRecentSubmissions(100) })

  const handleReadiness = () => {
    const o = stats?.overview || {}
    downloadCSV('student-readiness-report.csv', [
      ['Metric', 'Value'],
      ['Total Users', o.total_users],
      ['Active Users', o.active_users],
      ['Total Questions', o.total_questions],
      ['Total Coding Problems', o.total_coding_problems],
      ['Total Tests', o.total_tests],
      ['Total Companies', o.total_companies],
      ['Total Interviews', o.total_interviews],
      ['Total Submissions', o.total_submissions],
      ['Resume Reviews', o.total_resume_reviews],
      ['New Users This Week', o.new_users_this_week],
    ])
    toast.success('Student Readiness Report downloaded!')
  }

  const handleCoding = () => {
    const rows = [['Submission ID', 'User', 'Problem', 'Language', 'Status', 'Score', 'Submitted At']]
    ;(recent || []).forEach((s) => rows.push([s.id, s.user?.username, s.problem?.title, s.language, s.status, s.score, s.submitted_at]))
    downloadCSV('coding-submissions-report.csv', rows)
    toast.success('Coding Submissions Report downloaded!')
  }

  const handleCompany = () => {
    const rows = [['Category', 'Difficulty', 'Count']]
    const qs = qStats?.question_stats || {}
    Object.entries(qs).forEach(([cat, diffs]) => {
      Object.entries(diffs || {}).forEach(([diff, count]) => rows.push([cat, diff, count]))
    })
    rows.push([])
    rows.push(['Interview Metric', 'Value'])
    rows.push(['Total Interviews', iStats?.total_interviews])
    rows.push(['Completed', iStats?.completed_interviews])
    rows.push(['Completion Rate %', iStats?.completion_rate])
    rows.push(['Avg Score', iStats?.avg_overall_score])
    downloadCSV('company-interview-summary.csv', rows)
    toast.success('Company Summary Report downloaded!')
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiFileChartLine className="text-primary-600" /> Platform Reports & Analytics Export
        </h1>
        <p className="page-subtitle">Export student placement readiness stats, test scores, and performance summaries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-2xl">
              <RiPieChartLine />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Overall Student Readiness Report</h3>
            <p className="text-xs text-gray-500">Includes comprehensive score distributions across Aptitude, Coding, and AI Mock Interviews.</p>
          </div>
          <button onClick={handleReadiness} className="btn btn-primary w-full">
            <RiDownloadCloudLine /> Download CSV Report
          </button>
        </div>

        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 text-success-600 flex items-center justify-center text-2xl">
              <RiLineChartLine />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Coding Submissions Analytics</h3>
            <p className="text-xs text-gray-500">Breakdown of problem solve rates, Judge0 API performance metrics, and top student coders.</p>
          </div>
          <button onClick={handleCoding} className="btn btn-secondary w-full">
            <RiDownloadCloudLine /> Export CSV Summary
          </button>
        </div>

        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-2xl">
              <RiCheckDoubleLine />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Company Wise Interview Summary</h3>
            <p className="text-xs text-gray-500">Detailed stats on mock interview clear rates per target company profile.</p>
          </div>
          <button onClick={handleCompany} className="btn btn-secondary w-full">
            <RiDownloadCloudLine /> Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminReportsPage
