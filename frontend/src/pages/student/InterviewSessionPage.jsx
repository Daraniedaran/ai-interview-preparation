import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { interviewService } from '../../services'
import toast from 'react-hot-toast'
import {
  RiMicLine, RiMicOffLine, RiSendPlaneFill, RiRobotLine,
  RiVolumeUpLine
} from 'react-icons/ri'

const InterviewSessionPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentQNum, setCurrentQNum] = useState(1)
  const [currentQText, setCurrentQText] = useState('')
  const [totalQ, setTotalQ] = useState(5)
  const [answer, setAnswer] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [history, setHistory] = useState([])

  const { data: interviewData, isLoading } = useQuery({
    queryKey: ['interview-detail', id],
    queryFn: () => interviewService.getById(id),
  })

  useEffect(() => {
    if (interviewData) {
      setTotalQ(interviewData.total_questions)
      if (interviewData.status === 'completed') {
        navigate(`/interview/${id}/report`)
        return
      }
      // Always restore pending question text so fresh sessions don't show fallback
      if (interviewData.current_question_text) {
        setCurrentQText(interviewData.current_question_text)
      }
      if (interviewData.responses?.length > 0) {
        setHistory(interviewData.responses)
        const lastResp = interviewData.responses[interviewData.responses.length - 1]
        setCurrentQNum(lastResp.question_number + 1)
      } else {
        setCurrentQNum((interviewData.answered_questions || 0) + 1)
      }
    }
  }, [interviewData, id, navigate])

  const answerMutation = useMutation({
    mutationFn: interviewService.submitAnswer,
    onSuccess: (data) => {
      setHistory((prev) => [
        ...prev,
        {
          question_number: currentQNum,
          question_text: currentQText,
          student_answer: answer,
          ai_feedback: data.feedback,
          score: data.score,
        },
      ])
      setAnswer('')

      if (data.is_complete) {
        toast.success('Interview Completed! 🎉')
        navigate(`/interview/${id}/report`)
      } else {
        setCurrentQNum(data.next_question_number)
        setCurrentQText(data.next_question)
        toast.success('Answer recorded!')
      }
    },
    onError: () => toast.error('Failed to submit answer'),
  })

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error('Text-to-speech not supported in browser')
    }
  }

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input is not supported in this browser. Please type your answer.')
      return
    }

    if (isRecording) {
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setAnswer((prev) => prev + ' ' + transcript)
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)

    recognition.start()
  }

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer before submitting')
      return
    }
    if (!currentQText) {
      toast.error('Question is still loading. Please wait a moment.')
      return
    }
    answerMutation.mutate({
      interview_id: Number(id),
      question_number: currentQNum,
      question_text: currentQText,
      student_answer: answer,
    })
  }

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  const activeQuestion = currentQText || (isLoading ? 'Loading question…' : 'Question unavailable — please refresh the page.')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Progress Header */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center text-white font-bold">
            <RiRobotLine className="text-xl" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base">
              AI Interviewer ({interviewData?.interview_type})
            </h2>
            <p className="text-xs text-gray-400">Target Role: {interviewData?.target_role}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-semibold text-primary-600">
            Question {currentQNum} of {totalQ}
          </span>
          <div className="progress-bar w-32 h-2 mt-1">
            <div
              className="progress-fill h-full"
              style={{ width: `${(currentQNum / totalQ) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Interview Box */}
      <div className="card space-y-6 border-2 border-primary-100 dark:border-dark-700">
        {/* Question Prompt */}
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="badge badge-primary text-xs font-semibold">Current Question</span>
            <button
              onClick={() => handleSpeak(activeQuestion)}
              className="btn-ghost btn-sm text-primary-600"
              title="Listen to question"
            >
              <RiVolumeUpLine className="text-lg" /> Listen
            </button>
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
            &ldquo;{activeQuestion}&rdquo;
          </p>
        </div>

        {/* Answer Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Your Answer</label>
            <button
              onClick={toggleRecording}
              className={`btn-sm flex items-center gap-1.5 ${
                isRecording ? 'btn-danger animate-pulse' : 'btn-secondary'
              }`}
            >
              {isRecording ? <RiMicOffLine /> : <RiMicLine />}
              {isRecording ? 'Stop Recording' : 'Voice Input'}
            </button>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            placeholder="Type or speak your answer here... Be detailed and structure your response (Situation, Task, Action, Result for behavioral questions)."
            className="input resize-none text-sm leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={answerMutation.isPending}
            className="btn-primary py-2.5 px-6 font-semibold"
          >
            {answerMutation.isPending ? (
              'Evaluating Answer...'
            ) : (
              <>
                Submit Answer <RiSendPlaneFill />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Answer History & Realtime AI Feedback */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Previous Responses & AI Feedback
          </h3>

          {history.map((item, idx) => (
            <div key={idx} className="card space-y-3 bg-gray-50 dark:bg-dark-800">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Q{item.question_number}: {item.question_text}
                </span>
                {item.score && (
                  <span className="badge badge-success">{item.score}/100</span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-700 text-xs text-gray-700 dark:text-gray-300">
                <strong>Your Answer:</strong> {item.student_answer}
              </div>

              {item.ai_feedback && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <strong>🤖 AI Feedback:</strong>
                  <p>{item.ai_feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InterviewSessionPage
