import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { codingService } from '../../services'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  RiCodeSSlashLine, 
  RiAddLine, 
  RiSearchLine, 
  RiEditLine, 
  RiDeleteBin6Line,
  RiCheckDoubleLine
} from 'react-icons/ri'

const AdminCodingPage = () => {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')

  const { data: problems, isLoading } = useQuery({
    queryKey: ['admin-coding-list', search, difficulty],
    queryFn: () => codingService.list({ search, difficulty }),
  })

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiCodeSSlashLine className="text-primary-600" /> Coding Challenge Bank Manager
          </h1>
          <p className="page-subtitle">Configure DSA problems, test cases, starter code templates, and constraints</p>
        </div>

        <button className="btn btn-primary" onClick={() => toast('Coding problem creation is not wired to the API yet', { icon: '🚧' })}>
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
                        <button className="btn-icon text-gray-500 hover:text-primary-600">
                          <RiEditLine />
                        </button>
                        <button className="btn-icon text-gray-400 hover:text-danger-500">
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
    </div>
  )
}

export default AdminCodingPage
