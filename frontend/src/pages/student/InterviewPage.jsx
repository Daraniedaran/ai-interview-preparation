import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { interviewService, companyService } from '../../services'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  RiMicLine, RiPlayFill, RiFileTextLine,
  RiTimeLine
} from 'react-icons/ri'

const InterviewPage = () => {
  const navigate = useNavigate()
  const [interviewType, setInterviewType] = useState('technical')
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(5)
  const [companyId, setCompanyId] = useState('')

  const { data: myInterviews } = useQuery({
    queryKey: ['my-interviews'],
    queryFn: interviewService.getMyInterviews,
  })

  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => companyService.list({}),
  })

  const startMutation = useMutation({
    mutationFn: interviewService.start,
    onSuccess: (data) => {
      toast.success('Interview session created!')
      navigate(`/interview/${data.interview_id}`)
    },
    onError: () => toast.error('Failed to start interview'),
  })

  const handleStart = () => {
    startMutation.mutate({
      interview_type: interviewType,
      target_role: targetRole,
      difficulty,
      num_questions: Number(numQuestions),
      company_id: companyId ? Number(companyId) : null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">AI Mock Interviews</h1>
        <p className="page-subtitle">Practice real-time technical, behavioral, and HR interviews with AI feedback</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Setup New Interview Form */}
        <div className="lg:col-span-2 card space-y-5">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <RiMicLine className="text-primary-600" /> Start New Interview Session
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Interview Type</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="input"
              >
                <option value="technical">Technical Interview</option>
                <option value="hr">HR & Culture Fit</option>
                <option value="behavioral">Behavioral (STAR Method)</option>
                <option value="system_design">System Design</option>
                <option value="company_specific">Company Specific</option>
              </select>
            </div>

            <div>
              <label className="label">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input"
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div>
              <label className="label">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="label">Number of Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className="input"
              >
                <option value="3">3 Questions (Quick)</option>
                <option value="5">5 Questions (Standard)</option>
                <option value="10">10 Questions (Full)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Target Company (Optional)</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="input"
              >
                <option value="">General Interview</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="btn-primary w-full py-3 justify-center text-base font-semibold group"
          >
            {startMutation.isPending ? (
              'Initializing Session...'
            ) : (
              <>
                <RiPlayFill className="text-xl" /> Start AI Interview
              </>
            )}
          </button>
        </div>

        {/* History List */}
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
            <RiTimeLine className="text-primary-600" /> Recent Sessions
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {myInterviews?.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-primary uppercase text-[10px]">
                    {item.interview_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.started_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {item.target_role}
                  </span>
                  {item.overall_score && (
                    <span className="font-bold text-primary-600 text-sm">
                      {item.overall_score.toFixed(0)}/100
                    </span>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  {item.status === 'completed' ? (
                    <Link
                      to={`/interview/${item.id}/report`}
                      className="btn-secondary btn-sm text-[11px]"
                    >
                      <RiFileTextLine /> View Report
                    </Link>
                  ) : (
                    <Link
                      to={`/interview/${item.id}`}
                      className="btn-primary btn-sm text-[11px]"
                    >
                      Resume
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {!myInterviews?.length && (
              <div className="text-center py-8 text-gray-400 text-xs">
                No past interview sessions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewPage
