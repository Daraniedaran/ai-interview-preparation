import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { interviewService } from '../../services'
import toast from 'react-hot-toast'
import {
  RiDownloadLine, RiCheckLine, RiCloseLine, RiLightbulbLine,
  RiArrowLeftLine, RiAwardLine, RiStarFill
} from 'react-icons/ri'

const InterviewReportPage = () => {
  const { id } = useParams()

  const { data: report, isLoading } = useQuery({
    queryKey: ['interview-report', id],
    queryFn: () => interviewService.getById(id),
  })

  const handleDownload = async () => {
    try {
      const blob = await interviewService.downloadReport(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview_report_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download report PDF')
    }
  }

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/interview" className="btn-icon text-gray-500">
            <RiArrowLeftLine />
          </Link>
          <div>
            <h1 className="page-title">Interview Performance Report</h1>
            <p className="page-subtitle">Detailed breakdown and AI evaluation</p>
          </div>
        </div>

        <button onClick={handleDownload} className="btn-primary btn-sm">
          <RiDownloadLine /> Download PDF
        </button>
      </div>

      {/* Main Score Banner */}
      <div className="card bg-gradient-to-r from-primary-600 to-secondary-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 p-8">
        <div>
          <span className="badge bg-white/20 text-white uppercase text-xs mb-2">
            {report.interview_type} • {report.target_role}
          </span>
          <h2 className="text-2xl font-bold">Overall Evaluation</h2>
          <p className="text-blue-100 text-sm mt-1">
            Completed on {new Date(report.completed_at || report.started_at).toLocaleDateString()}
          </p>
        </div>

        <div className="text-center sm:text-right">
          <div className="text-5xl font-extrabold">{report.overall_score || 0}</div>
          <div className="text-xs text-blue-100 uppercase tracking-widest mt-1">Overall Score / 100</div>
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Technical', score: report.technical_score },
          { label: 'Communication', score: report.communication_score },
          { label: 'Confidence', score: report.confidence_score },
          { label: 'Professionalism', score: report.professionalism_score },
        ].map(({ label, score }) => (
          <div key={label} className="card text-center">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{score || 0}%</div>
            <div className="progress-bar h-1.5 mt-2">
              <div className="progress-fill h-full" style={{ width: `${score || 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {report.ai_summary && (
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">AI Summary</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{report.ai_summary}</p>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-success-600 text-base flex items-center gap-2 mb-3">
            <RiCheckLine /> Key Strengths
          </h3>
          <ul className="space-y-2">
            {report.strengths?.map((s, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-success-500">•</span> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="font-bold text-danger-500 text-base flex items-center gap-2 mb-3">
            <RiCloseLine /> Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {report.areas_to_improve?.map((a, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-danger-500">•</span> {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question Responses Detailed Log */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-base">Detailed Question Analysis</h3>

        <div className="space-y-4">
          {report.responses?.map((r) => (
            <div key={r.question_number} className="p-4 rounded-xl border border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  Q{r.question_number}: {r.question_text}
                </span>
                <span className="badge badge-primary">{r.score}/100</span>
              </div>

              <div className="p-2.5 rounded bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300">
                <strong>Your Answer:</strong> {r.student_answer}
              </div>

              {r.ai_feedback && (
                <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200">
                  <strong>Feedback:</strong> {r.ai_feedback}
                </div>
              )}

              {r.ideal_answer && (
                <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200">
                  <strong>Ideal Answer Sample:</strong> {r.ideal_answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InterviewReportPage
