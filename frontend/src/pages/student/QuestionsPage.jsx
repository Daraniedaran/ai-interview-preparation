import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionService } from '../../services'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiQuestionnaireLine, 
  RiSearchLine, 
  RiBookmarkLine, 
  RiBookmarkFill, 
  RiEyeLine, 
  RiEyeOffLine,
  RiBuildingLine,
  RiPriceTag3Line
} from 'react-icons/ri'
import toast from 'react-hot-toast'

const difficultyColor = {
  easy: 'difficulty-easy',
  medium: 'difficulty-medium',
  hard: 'difficulty-hard',
}

const QuestionsPage = () => {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [category, setCategory] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [bookmarksOnly, setBookmarksOnly] = useState(false)

  const queryClient = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['question-categories'],
    queryFn: questionService.getCategories,
  })

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions-list', search, difficulty, category, bookmarksOnly],
    queryFn: () => bookmarksOnly 
      ? questionService.getBookmarks()
      : questionService.list({ search, difficulty, category }),
  })

  const bookmarkMutation = useMutation({
    mutationFn: (id) => questionService.toggleBookmark(id),
    onSuccess: (data) => {
      toast.success(data.message || 'Bookmark updated')
      queryClient.invalidateQueries(['questions-list'])
    },
    onError: () => {
      toast.error('Failed to update bookmark')
    }
  })

  // list returns { questions, total, ... }; bookmarks/me returns a bare array
  const questionList = Array.isArray(questions) ? questions : questions?.questions || []

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiQuestionnaireLine className="text-primary-600" /> Theoretical Question Bank
          </h1>
          <p className="page-subtitle">Master key concepts and frequently asked interview questions</p>
        </div>
        <button
          onClick={() => setBookmarksOnly(!bookmarksOnly)}
          className={`btn ${bookmarksOnly ? 'btn-primary' : 'btn-secondary'}`}
        >
          <RiBookmarkFill /> {bookmarksOnly ? 'Showing Bookmarks' : 'My Bookmarks'}
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or keywords..."
            className="input pl-10"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input w-36"
            disabled={bookmarksOnly}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-44"
            disabled={bookmarksOnly}
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="h-6 skeleton w-3/4" />
              <div className="h-4 skeleton w-1/2" />
            </div>
          ))
        ) : questionList.length > 0 ? (
          questionList.map((q, idx) => (
            <motion.div
              key={q.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:border-primary-200 dark:hover:border-dark-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
                    <span className={difficultyColor[q.difficulty?.toLowerCase()] || 'badge badge-gray'}>
                      {q.difficulty}
                    </span>
                    <span className="badge badge-gray flex items-center gap-1">
                      <RiPriceTag3Line className="text-xs" /> {q.category}
                    </span>
                    {q.company && (
                      <span className="badge badge-primary flex items-center gap-1">
                        <RiBuildingLine className="text-xs" /> {q.company}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {q.question || q.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bookmarkMutation.mutate(q.id)}
                    className="btn-icon text-gray-400 hover:text-amber-500"
                    title="Bookmark Question"
                  >
                    {q.bookmarked ? (
                      <RiBookmarkFill className="text-amber-500 text-xl" />
                    ) : (
                      <RiBookmarkLine className="text-xl" />
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {expandedId === q.id ? (
                      <>
                        <RiEyeOffLine /> Hide Answer
                      </>
                    ) : (
                      <>
                        <RiEyeLine /> Show Answer
                      </>
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === q.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700"
                  >
                    <div className="bg-gray-50 dark:bg-dark-900/60 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Sample Answer / Explanation
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {q.answer || q.sample_answer || 'Sample answer not provided yet. Practice structuring your own answer.'}
                      </p>
                      {q.key_points?.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Key Takeaways:</span>
                          <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                            {q.key_points.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="card text-center py-12 text-gray-400">
            <RiQuestionnaireLine className="text-5xl mx-auto mb-2 opacity-30" />
            <p>No questions found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionsPage
