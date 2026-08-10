import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionService } from '../../services'
import { 
  RiQuestionnaireLine, 
  RiAddLine, 
  RiSearchLine, 
  RiEditLine, 
  RiDeleteBin6Line,
  RiCloseLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'

// Valid backend QuestionCategory enum values
const VALID_CATEGORIES = [
  'quantitative', 'logical', 'verbal', 'data_interpretation',
  'general', 'technical', 'behavioral', 'hr', 'coding',
]

const AdminQuestionsPage = () => {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('technical')
  const [formDifficulty, setFormDifficulty] = useState('medium')
  const [formAnswer, setFormAnswer] = useState('')

  const queryClient = useQueryClient()

  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions-list', search, difficulty],
    queryFn: () => questionService.list({ search, difficulty }),
  })

  // Backend list returns { questions, total, ... }
  const questionList = Array.isArray(questions) ? questions : questions?.questions || []

  const createMutation = useMutation({
    mutationFn: (data) => questionService.create(data),
    onSuccess: () => {
      toast.success('Question added successfully')
      queryClient.invalidateQueries(['admin-questions-list'])
      setShowModal(false)
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
        : 'Failed to save question'
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => questionService.update(id, data),
    onSuccess: () => {
      toast.success('Question updated')
      queryClient.invalidateQueries(['admin-questions-list'])
      setShowModal(false)
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
        : 'Failed to update question'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => questionService.delete(id),
    onSuccess: () => {
      toast.success('Question deleted')
      queryClient.invalidateQueries(['admin-questions-list'])
    },
  })

  const handleOpenModal = (q = null) => {
    if (q) {
      setEditingQuestion(q)
      setFormTitle(q.title || '')
      setFormCategory(q.category || 'technical')
      setFormDifficulty(q.difficulty || 'medium')
      setFormAnswer(q.correct_answer || '')
    } else {
      setEditingQuestion(null)
      setFormTitle('')
      setFormCategory('technical')
      setFormDifficulty('medium')
      setFormAnswer('')
    }
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formTitle.trim()) return toast.error('Question text is required')
    
    const payload = {
      title: formTitle,
      content: formTitle,
      question_type: 'subjective',
      category: formCategory,
      difficulty: formDifficulty,
      correct_answer: formAnswer || '',
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiQuestionnaireLine className="text-primary-600" /> Theoretical Question Bank Manager
          </h1>
          <p className="page-subtitle">Add and edit practice questions, sample answers, and category tags</p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <RiAddLine /> Add New Question
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question contents..."
            className="input pl-10"
          />
        </div>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="input w-full md:w-44"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="py-4">
                      <div className="h-6 skeleton" />
                    </td>
                  </tr>
                ))
              ) : questionList.length > 0 ? (
                questionList.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <div className="font-semibold text-gray-900 dark:text-white">{q.title}</div>
                      <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{q.correct_answer || 'No answer snippet'}</div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{q.category?.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(q)}
                          className="btn-icon text-gray-500 hover:text-primary-600"
                        >
                          <RiEditLine />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this question?')) deleteMutation.mutate(q.id)
                          }}
                          className="btn-icon text-gray-400 hover:text-danger-500"
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <RiQuestionnaireLine className="text-5xl mx-auto mb-2 opacity-30" />
                    No questions in bank.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <RiCloseLine />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Question Prompt</label>
                <textarea
                  rows={3}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. What is the difference between Processes and Threads?"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="input"
                  >
                    {VALID_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="input"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Sample Answer / Solution</label>
                <textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Key explanation points..."
                  className="input font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminQuestionsPage
