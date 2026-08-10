import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { codingService } from '../../services'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiCodeLine, RiSearchLine, RiCheckLine, RiFireLine, RiArrowRightLine } from 'react-icons/ri'

const difficultyColor = {
  easy: 'difficulty-easy',
  medium: 'difficulty-medium',
  hard: 'difficulty-hard',
}

const CodingPage = () => {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [category, setCategory] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['coding-categories'],
    queryFn: codingService.getCategories,
  })

  const { data: problems, isLoading } = useQuery({
    queryKey: ['coding-problems', search, difficulty, category],
    queryFn: () => codingService.list({ search, difficulty, category }),
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Coding Challenges</h1>
        <p className="page-subtitle">Practice Data Structures & Algorithms with real-time code execution</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problem title or category..."
            className="input pl-10"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input w-36"
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
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems List */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Title</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Acceptance</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4">
                      <div className="h-6 skeleton" />
                    </td>
                  </tr>
                ))
              ) : problems?.length > 0 ? (
                problems.map((problem, i) => (
                  <tr key={problem.id}>
                    <td className="text-center font-mono text-xs text-gray-400">{i + 1}</td>
                    <td>
                      <Link
                        to={`/coding/${problem.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors"
                      >
                        {problem.title}
                      </Link>
                      <div className="flex gap-1.5 mt-1">
                        {problem.tags?.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-700 text-gray-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{problem.category}</span>
                    </td>
                    <td>
                      <span className={difficultyColor[problem.difficulty?.toLowerCase()] || 'badge badge-gray'}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16 h-1.5">
                          <div
                            className="progress-fill h-full"
                            style={{ width: `${problem.acceptance_rate || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          {problem.acceptance_rate?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <Link to={`/coding/${problem.id}`} className="btn-primary btn-sm">
                        Solve <RiArrowRightLine />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <RiCodeLine className="text-5xl mx-auto mb-2 opacity-30" />
                    No coding problems found.
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

export default CodingPage
