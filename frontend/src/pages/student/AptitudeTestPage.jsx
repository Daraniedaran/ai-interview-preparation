import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { aptitudeService } from '../../services'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { RiTimeLine, RiArrowRightLine, RiArrowLeftLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'

const AptitudeTestPage = () => {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [testData, setTestData] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const timerRef = useRef(null)

  const startMutation = useMutation({
    mutationFn: () => aptitudeService.startTest(testId),
    onSuccess: (data) => {
      setTestData(data)
      setTimeLeft(data.duration_minutes * 60)
    },
    onError: () => { toast.error('Failed to start test'); navigate('/aptitude') },
  })

  const submitMutation = useMutation({
    mutationFn: ({ attemptId, answers }) => aptitudeService.submitTest(attemptId, answers),
    onSuccess: (data) => {
      setResult(data)
      setIsSubmitted(true)
      clearInterval(timerRef.current)
    },
    onError: () => toast.error('Submission failed'),
  })

  useEffect(() => {
    startMutation.mutate()
  }, [testId])

  useEffect(() => {
    if (timeLeft === null || isSubmitted) return
    if (timeLeft <= 0) {
      handleSubmit(true)
      return
    }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timeLeft, isSubmitted])

  const handleSubmit = (autoSubmit = false) => {
    if (submitMutation.isPending) return
    if (!autoSubmit && Object.keys(answers).length === 0) {
      toast.error('Please answer at least one question')
      return
    }
    // Auto-submit on timeout must never be cancellable (answers are locked in)
    if (autoSubmit) {
      toast.info('Time is up — submitting your answers')
    } else if (!window.confirm('Submit test?')) {
      return
    }
    submitMutation.mutate({ attemptId: testData.attempt_id, answers })
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (startMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-gray-500">Loading test questions...</p>
      </div>
    )
  }

  if (isSubmitted && result) {
    const pct = result.total_marks ? Math.round((result.score / result.total_marks) * 100) : 0
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Test Complete!</h2>
          <div className="my-6">
            <div className="text-4xl font-extrabold gradient-text">{pct}%</div>
            <p className="text-gray-500 mt-1">{(result.score ?? 0).toFixed(1)} / {result.total_marks} marks</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold text-success-600">{result.correct_answers}</div>
              <div className="text-xs text-gray-400">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-danger-500">{result.wrong_answers}</div>
              <div className="text-xs text-gray-400">Wrong</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-400">{result.unattempted}</div>
              <div className="text-xs text-gray-400">Skipped</div>
            </div>
          </div>
          {result.percentile > 0 && (
            <div className="mb-6 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <p className="text-primary-700 dark:text-primary-300 font-medium">Better than {result.percentile}% of test-takers</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate('/aptitude')} className="btn-secondary flex-1 justify-center">Back to Tests</button>
            <button onClick={() => { setIsSubmitted(false); setResult(null); setAnswers({}); setCurrentQ(0); startMutation.mutate() }} className="btn-primary flex-1 justify-center">Retake</button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!testData) return null

  const questions = testData.questions || []
  const q = questions[currentQ]
  const answered = Object.keys(answers).length
  const timerColor = timeLeft < 300 ? 'text-danger-500' : 'text-gray-700 dark:text-gray-300'

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Test Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Aptitude Test</h2>
            <p className="text-xs text-gray-400">{answered}/{questions.length} answered</p>
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
            <RiTimeLine />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        {/* Progress */}
        <div className="mt-3">
          <div className="progress-bar h-2">
            <div className="progress-fill h-full" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{currentQ + 1} of {questions.length}</p>
        </div>
        {/* Question Grid */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                i === currentQ ? 'bg-primary-600 text-white' :
                answers[_?.id] ? 'bg-success-100 text-success-700 dark:bg-success-900/30' :
                'bg-gray-100 dark:bg-dark-700 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      {q && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white leading-relaxed">
                Q{currentQ + 1}. {q.title || q.content}
              </h3>
              <span className="badge badge-gray flex-shrink-0">{q.marks} mark(s)</span>
            </div>
            {q.content && q.content !== q.title && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{q.content}</p>
            )}
            <div className="space-y-2">
              {(q.options || []).map((opt, i) => {
                const isSelected = answers[q.id] === opt
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-dark-600 hover:border-primary-300 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
          disabled={currentQ === 0}
          className="btn-secondary"
        >
          <RiArrowLeftLine /> Previous
        </button>
        <div className="flex gap-2">
          {currentQ < questions.length - 1 ? (
            <button onClick={() => setCurrentQ(q => q + 1)} className="btn-primary">
              Next <RiArrowRightLine />
            </button>
          ) : (
            <button onClick={() => handleSubmit()} className="btn-success" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AptitudeTestPage
