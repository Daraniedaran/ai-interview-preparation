import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { companyService } from '../../services'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiBuildingLine, RiSearchLine, RiStarFill, RiArrowRightLine } from 'react-icons/ri'

const CompaniesPage = () => {
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [difficulty, setDifficulty] = useState('')

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', search, industry, difficulty],
    queryFn: () => companyService.list({ search, industry, difficulty }),
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Company-Wise Preparation</h1>
        <p className="page-subtitle">Prepare specifically for top tech companies & placement drives</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name..."
            className="input pl-10"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input w-36"
          >
            <option value="">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Company Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="card h-48 skeleton" />)
        ) : (
          companies?.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center font-bold text-gray-800 dark:text-gray-200 text-lg">
                    {company.name[0]}
                  </div>
                  <span className={`badge ${company.difficulty === 'Easy' ? 'badge-success' : company.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                    {company.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{company.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{company.industry} • {company.headquarters}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                  <RiStarFill /> {company.glassdoor_rating || '4.0'}
                </div>
                <Link to={`/companies/${company.slug}`} className="btn-primary btn-sm">
                  View Process <RiArrowRightLine />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default CompaniesPage
