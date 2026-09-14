import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { codingService } from '../../services'
import toast from 'react-hot-toast'
import { 
  RiCodeSSlashLine, 
  RiAddLine, 
  RiSearchLine, 
  RiEditLine, 
  RiDeleteBin6Line,
  RiCheckDoubleLine,
  RiCloseLine
} from 'react-icons/ri'

const AdminCodingPage = () => {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', slug: '', problem_statement: '', difficulty: 'medium', category: 'Arrays' })

  const queryClient = useQueryClient()
  const { data: problems, isLoading } = useQuery({
    queryKey: ['admin-coding-list', search, difficulty],
    queryFn: () => codingService.list({ search, difficulty }),
  })

  const createMutation = useMutation({
    mutationFn: (data) => codingService.create(data),
    onSuccess: () => {
      toast.success('Coding problem created')
      queryClient.invalidateQueries({ queryKey: ['admin-coding-list'] })
      setShowModal(false)
      setForm({ title: '', slug: '', problem_statement: '', difficulty: 'medium', category: 'Arrays' })
    },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => codingService.update(id, data),
    onSuccess: () => {
      toast.success('Problem updated')
      queryClient.invalidateQueries({ queryKey: ['admin-coding-list'] })
      setEditing(null)
      setShowModal(false)
    },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => codingService.delete(id),
    onSuccess: () => {
      toast.success('Problem deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-coding-list'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', slug: '', problem_statement: '', difficulty: 'medium', category: 'Arrays' })
    setShowModal(true)
  }

  const openEdit = (prob) => {
    setEditing(prob)
    setForm({ title: prob.title || '', slug: prob.slug || '', problem_statement: '', difficulty: prob.difficulty || 'medium', category: prob.category || 'Arrays' })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim() || !form.problem_statement.trim()) {
      return toast.error('Title, slug and problem statement are required')
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { title: form.title, slug: form.slug, difficulty: form.difficulty, category: form.category } })
    } else {
      createMutation.mutate({
        ...form,
        input_format: '',
        output_format: '',
        test_cases: [],
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiCodeSSlashLine className="text-primary-600" /> Coding Challenge Bank Manager
          </h1>
          <p className="page-subtitle">Configure DSA problems, test cases, starter code templates, and constraints</p>
        </div>

        <button className="btn btn-primary" onClick={openCreate}>
          <RiAddLine /> Create Coding Problem
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problem title or tags..."
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
                <th>Title</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Test Cases</th>
                <th className="text-right">Actions</th>
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
              ) : problems?.length > 0 ? (
                problems.map((prob) => (
                  <tr key={prob.id}>
                    <td>
                      <div className="font-semibold text-gray-900 dark:text-white">{prob.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <RiCheckDoubleLine className="text-success-500" /> {prob.acceptance_rate || 75}% pass rate
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{prob.category || 'Algorithms'}</span>
                    </td>
                    <td>
                      <span className={`badge ${prob.difficulty === 'easy' ? 'badge-success' : prob.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-500">
                      {prob.test_cases_count || 10} hidden test cases
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-icon text-gray-500 hover:text-primary-600"
                          title="Edit problem"
                          onClick={() => openEdit(prob)}
                        >
                          <RiEditLine />
                        </button>
                        <button
                          className="btn-icon text-gray-400 hover:text-danger-500"
                          title="Delete problem"
                          onClick={() => { if (window.confirm(`Delete "${prob.title}"?`)) deleteMutation.mutate(prob.id) }}
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <RiCodeSSlashLine className="text-5xl mx-auto mb-2 opacity-30" />
                    No coding problems configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit Coding Problem' : 'Create Coding Problem'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon"><RiCloseLine /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Two Sum" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input font-mono text-xs" placeholder="two-sum" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" placeholder="Arrays" />
                </div>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              {!editing && (
                <div>
                  <label className="label">Problem Statement</label>
                  <textarea value={form.problem_statement} onChange={(e) => setForm({ ...form, problem_statement: e.target.value })} rows={4} className="input text-xs" placeholder="Describe the problem..." />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCodingPage
