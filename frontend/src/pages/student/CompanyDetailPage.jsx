import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { companyService } from '../../services'
import { RiBuildingLine, RiStarFill, RiCheckLine, RiCodeLine, RiQuestionLine, RiArrowLeftLine } from 'react-icons/ri'

const CompanyDetailPage = () => {
  const { slug } = useParams()

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-detail', slug],
    queryFn: () => companyService.getBySlug(slug),
  })

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/companies" className="btn-icon text-gray-500">
          <RiArrowLeftLine />
        </Link>
        <div>
          <h1 className="page-title">{company.name} Interview Guide</h1>
          <p className="page-subtitle">{company.industry} • {company.headquarters}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl">
              {company.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{company.name}</h2>
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold mt-0.5">
                <RiStarFill /> {company.glassdoor_rating} Rating • Avg Package: {company.avg_salary}
              </div>
            </div>
          </div>
          <span className={`badge ${company.difficulty === 'Easy' ? 'badge-success' : company.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
            {company.difficulty} Difficulty
          </span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{company.description}</p>
      </div>

      {/* Interview Rounds */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-base">Interview Process & Rounds</h3>

        <div className="space-y-3">
          {company.rounds?.map((r) => (
            <div key={r.round_number} className="p-4 rounded-xl border border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 flex items-start gap-4 text-xs">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 font-bold flex items-center justify-center flex-shrink-0">
                {r.round_number}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{r.round_name}</h4>
                <p className="text-gray-600 dark:text-gray-400">{r.description}</p>
                {r.duration_minutes && <p className="text-gray-400">Duration: ~{r.duration_minutes} minutes</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips & Topics */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Preparation Tips</h3>
          <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            {company.preparation_tips?.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <RiCheckLine className="text-success-500 mt-0.5 flex-shrink-0" /> {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Frequently Asked Topics</h3>
          <div className="flex flex-wrap gap-2">
            {company.frequently_asked_topics?.map((topic, i) => (
              <span key={i} className="badge badge-primary">{topic}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyDetailPage
