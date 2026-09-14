import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../../services'
import { 
  RiBuildingLine, 
  RiAddLine, 
  RiSearchLine, 
  RiEditLine, 
  RiMoneyDollarCircleLine,
  RiCloseLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'

const AdminCompaniesPage = () => {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [pkg, setPkg] = useState('')
  const [description, setDescription] = useState('')

  const queryClient = useQueryClient()

  const { data: companies, isLoading } = useQuery({
    queryKey: ['admin-companies-list', search],
    queryFn: () => companyService.list({ search }),
  })

  const createMutation = useMutation({
    mutationFn: (data) => companyService.create(data),
    onSuccess: () => {
      toast.success('Company added')
      queryClient.invalidateQueries({ queryKey: ['admin-companies-list'] })
      setShowModal(false)
      setName(''); setPkg(''); setDescription(''); setEditing(null)
    },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => companyService.update(id, data),
    onSuccess: () => {
      toast.success('Company updated')
      queryClient.invalidateQueries({ queryKey: ['admin-companies-list'] })
      setShowModal(false)
      setName(''); setPkg(''); setDescription(''); setEditing(null)
    },
    onError: (e) => toast.error(e?.response?.data?.detail || 'Update failed'),
  })

  const openCreate = () => {
    setEditing(null); setName(''); setPkg(''); setDescription('')
    setShowModal(true)
  }

  const openEdit = (comp) => {
    setEditing(comp)
    setName(comp.name || ''); setPkg(comp.avg_salary || ''); setDescription(comp.description || '')
    setShowModal(true)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Company name required')
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { name, avg_salary: pkg, description } })
    } else {
      createMutation.mutate({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        avg_salary: pkg,
        description,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiBuildingLine className="text-primary-600" /> Target Company Management
          </h1>
          <p className="page-subtitle">Manage company recruitment profiles, average packages, and interview patterns</p>
        </div>

        <button onClick={openCreate} className="btn btn-primary">
          <RiAddLine /> Add Company
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="h-6 skeleton w-1/2" />
              <div className="h-4 skeleton w-3/4" />
            </div>
          ))
        ) : companies?.length > 0 ? (
          companies.map((comp) => (
            <div key={comp.id} className="card space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{comp.name}</h3>
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <RiMoneyDollarCircleLine /> {comp.avg_salary || '—'}
                  </div>
                </div>
                <button
                  className="btn-icon text-gray-400 hover:text-primary-600"
                  title="Edit company"
                  onClick={() => openEdit(comp)}
                >
                  <RiEditLine />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {comp.description || 'Recruitment partner company providing software engineering & tech roles.'}
              </p>

              <div className="pt-2 border-t border-gray-100 dark:border-dark-700 text-[11px] text-gray-400 flex justify-between">
                <span>{comp.industry || 'Technology'} · {comp.headquarters || '—'}</span>
                <span>{comp.glassdoor_rating ? `★ ${comp.glassdoor_rating}` : comp.difficulty || ''}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="card col-span-full text-center py-12 text-gray-400">
            <RiBuildingLine className="text-5xl mx-auto mb-2 opacity-30" />
            No companies found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit Company' : 'Add Company Profile'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <RiCloseLine />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Google, Microsoft"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Salary Range / Package</label>
                <input
                  type="text"
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value)}
                  placeholder="e.g. 18 - 25 LPA"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Description / Overview</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Company hiring overview..."
                  className="input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Save Changes' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCompaniesPage
