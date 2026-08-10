import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { resumeService } from '../../services'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  RiUploadCloudLine, RiFileTextLine, RiDownloadLine, RiCheckLine,
  RiCloseLine, RiStarLine, RiErrorWarningLine, RiLightbulbLine,
  RiSearchLine, RiTimeLine
} from 'react-icons/ri'

const ScoreCircle = ({ score, label, size = 'lg' }) => {
  const radius = size === 'lg' ? 54 : 36
  const stroke = size === 'lg' ? 8 : 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ((score || 0) / 100) * circumference

  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size === 'lg' ? 140 : 100} height={size === 'lg' ? 140 : 100} className="-rotate-90">
          <circle cx={size === 'lg' ? 70 : 50} cy={size === 'lg' ? 70 : 50} r={radius} strokeWidth={stroke}
            stroke="#E5E7EB" fill="none" className="dark:stroke-dark-700" />
          <circle cx={size === 'lg' ? 70 : 50} cy={size === 'lg' ? 70 : 50} r={radius} strokeWidth={stroke}
            stroke={color} fill="none" strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className={`font-bold text-gray-900 dark:text-white ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
            {score || 0}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
    </div>
  )
}

const ResumePage = () => {
  const fileRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  const { data: reviews, refetch } = useQuery({
    queryKey: ['resume-reviews'],
    queryFn: resumeService.getReviews,
  })

  const { data: reviewDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['resume-review-detail', selectedReview],
    queryFn: () => resumeService.getReviewDetail(selectedReview),
    enabled: !!selectedReview,
  })

  const uploadMutation = useMutation({
    mutationFn: resumeService.uploadResume,
    onSuccess: (data) => {
      refetch()
      setSelectedReview(data.review_id)
      toast.success('Resume analyzed successfully! 🎉')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Upload failed'),
  })

  const handleFile = (file) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    uploadMutation.mutate(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDownload = async (id) => {
    try {
      const blob = await resumeService.downloadReviewPDF(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_review_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">AI Resume Review</h1>
        <p className="page-subtitle">Upload your resume to get instant AI feedback, ATS score, and improvement suggestions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Upload + History */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`card border-2 border-dashed cursor-pointer transition-all ${
              isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600 hover:border-primary-400'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              id="resume-upload"
            />
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Analyzing your resume with AI...</p>
                <p className="text-xs text-gray-400">This may take 30-60 seconds</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <RiUploadCloudLine className="text-3xl text-primary-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Drop your resume here</p>
                  <p className="text-xs text-gray-400 mt-1">PDF only • Max 10MB</p>
                </div>
                <span className="btn-primary btn-sm">Choose File</span>
              </div>
            )}
          </div>

          {/* Review History */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Review History</h3>
            {reviews?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Upload your resume!</p>
            )}
            <div className="space-y-2">
              {reviews?.map(review => (
                <button
                  key={review.id}
                  onClick={() => setSelectedReview(review.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedReview === review.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-100 dark:border-dark-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiFileTextLine className="text-primary-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                        {review.original_filename}
                      </span>
                    </div>
                    {review.resume_score && (
                      <span className={`badge ${review.resume_score >= 80 ? 'badge-success' : review.resume_score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                        {review.resume_score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <RiTimeLine />
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Review Detail */}
        <div className="lg:col-span-2">
          {!selectedReview ? (
            <div className="card flex flex-col items-center justify-center min-h-[400px] text-center">
              <RiFileTextLine className="text-5xl text-gray-300 dark:text-dark-600 mb-4" />
              <h3 className="font-semibold text-gray-500 dark:text-gray-400">No review selected</h3>
              <p className="text-sm text-gray-400 mt-1">Upload a resume or select a previous review</p>
            </div>
          ) : detailLoading ? (
            <div className="card min-h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : reviewDetail ? (
            <div className="space-y-4">
              {/* Score Cards */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Resume Analysis</h3>
                  <button onClick={() => handleDownload(reviewDetail.id)} className="btn-secondary btn-sm">
                    <RiDownloadLine /> Download PDF
                  </button>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-8">
                  <ScoreCircle score={reviewDetail.resume_score} label="Overall Score" />
                  <ScoreCircle score={reviewDetail.ats_score} label="ATS Score" />
                </div>

                {/* Section Scores */}
                {reviewDetail.section_scores && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {Object.entries(reviewDetail.section_scores).map(([section, score]) => (
                      <div key={section}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-gray-600 dark:text-gray-400">{section}</span>
                          <span className="font-medium">{score}/100</span>
                        </div>
                        <div className="progress-bar h-1.5">
                          <div className="progress-fill h-full" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card">
                  <h4 className="font-semibold text-success-700 dark:text-success-400 flex items-center gap-2 mb-3 text-sm">
                    <RiCheckLine /> Strengths ({reviewDetail.strengths?.length || 0})
                  </h4>
                  <ul className="space-y-2">
                    {reviewDetail.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <RiCheckLine className="text-success-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h4 className="font-semibold text-danger-600 dark:text-danger-400 flex items-center gap-2 mb-3 text-sm">
                    <RiCloseLine /> Areas to Improve ({reviewDetail.weaknesses?.length || 0})
                  </h4>
                  <ul className="space-y-2">
                    {reviewDetail.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <RiCloseLine className="text-danger-500 flex-shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Skills */}
              {reviewDetail.missing_skills?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-warning-700 dark:text-warning-400 flex items-center gap-2 mb-3 text-sm">
                    <RiSearchLine /> Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewDetail.missing_skills?.map((skill, i) => (
                      <span key={i} className="badge badge-warning">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {reviewDetail.improvements?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-primary-700 dark:text-primary-400 flex items-center gap-2 mb-3 text-sm">
                    <RiLightbulbLine /> Improvement Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {reviewDetail.improvements?.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Feedback */}
              {reviewDetail.ai_feedback && (
                <div className="card bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-100 dark:border-primary-800">
                  <h4 className="font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-2 mb-3 text-sm">
                    🤖 AI Expert Feedback
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{reviewDetail.ai_feedback}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ResumePage
