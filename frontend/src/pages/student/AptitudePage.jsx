import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { aptitudeService } from '../../services'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  RiBrainLine, RiTimeLine,
  RiArrowRightLine, RiQuestionLine
} from 'react-icons/ri'

const categoryConfig = {
  quantitative: { color: 'from-blue-500 to-cyan-500', icon: '📊', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  logical: { color: 'from-purple-500 to-pink-500', icon: '🧩', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  verbal: { color: 'from-green-500 to-emerald-500', icon: '📝', bg: 'bg-green-50 dark:bg-green-900/20' },
  data_interpretation: { color: 'from-orange-500 to-yellow-500', icon: '📈', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  general: { color: 'from-red-500 to-orange-500', icon: '🎯', bg: 'bg-red-50 dark:bg-red-900/20' },
  technical: { color: 'from-indigo-500 to-blue-500', icon: '💻', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  behavioral: { color: 'from-teal-500 to-green-500', icon: '🤝', bg: 'bg-teal-50 dark:bg-teal-900/20' },
}

const AptitudePage = () => {
  const [activeTab, setActiveTab] = useState('tests')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const { data: tests, isLoading } = useQuery({
    queryKey: ['aptitude-tests', selectedCategory],
    queryFn: () => aptitudeService.listTests({ category: selectedCategory }),
  })

  const { data: attempts } = useQuery({
    queryKey: ['aptitude-attempts'],
    queryFn: aptitudeService.getMyAttempts,
  })

  const difficultyColor = { easy: 'difficulty-easy', medium: 'difficulty-medium', hard: 'difficulty-hard' }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Aptitude Practice</h1>
        <p className="page-subtitle">Master quantitative, logical, verbal, and technical aptitude for campus placements</p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tests Taken', value: attempts?.length || 0, icon: '📝' },
          {
            label: 'Avg Score',
            value: attempts?.length
              ? Math.round(attempts.reduce((a, b) => a + (b.score / b.total_marks) * 100, 0) / attempts.length) + '%'
              : '—',
            icon: '📊'
          },
          {
            label: 'Best Percentile',
            value: attempts?.length
              ? Math.max(...attempts.map(a => a.percentile || 0)) + '%'
              : '—',
            icon: '🏆'
          },
        ].map(({ label, value, icon }, i) => (
          <div key={i} className="card text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-dark-700">
        {['tests', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'tests' ? 'Practice Tests' : 'My History'}
          </button>
        ))}
      </div>

      {activeTab === 'tests' && (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.entries(categoryConfig).map(([cat, config]) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {config.icon} {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Tests Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="card h-40 skeleton" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests?.map((test, i) => {
                const config = categoryConfig[test.category?.toLowerCase()] || categoryConfig.general
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-hover group"
                  >
                    <div className={`${config.bg} rounded-xl p-3 mb-3 inline-flex items-center gap-2`}>
                      <span className="text-xl">{config.icon}</span>
                      <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">
                        {test.category?.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{test.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><RiQuestionLine />{test.total_questions} Qs</span>
                      <span className="flex items-center gap-1"><RiTimeLine />{test.duration_minutes} min</span>
                      <span className={difficultyColor[test.difficulty?.toLowerCase()] || 'badge badge-gray'}>{test.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {test.attempt_count > 0 && (
                        <span className="text-xs text-gray-400">{test.attempt_count} attempt(s)</span>
                      )}
                      <Link
                        to={`/aptitude/test/${test.id}`}
                        className="btn-primary btn-sm ml-auto group"
                      >
                        {test.attempt_count > 0 ? 'Retry' : 'Start Test'}
                        <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
              {tests?.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-400">
                  <RiBrainLine className="text-5xl mx-auto mb-3 opacity-30" />
                  <p>No tests available for this category.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>Percentile</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts?.map(attempt => (
                  <tr key={attempt.id}>
                    <td className="font-medium">Test #{attempt.test_id}</td>
                    <td>
                      <span className={`font-bold ${attempt.score / attempt.total_marks >= 0.8 ? 'text-success-600' : attempt.score / attempt.total_marks >= 0.6 ? 'text-warning-600' : 'text-danger-600'}`}>
                        {attempt.score?.toFixed(1)}/{attempt.total_marks}
                      </span>
                    </td>
                    <td className="text-success-600">✓ {attempt.correct_answers}</td>
                    <td className="text-danger-500">✗ {attempt.wrong_answers}</td>
                    <td>
                      <span className="badge badge-primary">{attempt.percentile}%ile</span>
                    </td>
                    <td className="text-gray-400 text-xs">
                      {attempt.completed_at ? format(new Date(attempt.completed_at), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!attempts?.length && (
              <div className="text-center py-10 text-gray-400">
                <p>No attempts yet. Take your first aptitude test!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AptitudePage
