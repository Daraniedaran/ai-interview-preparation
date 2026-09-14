import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services'
import { 
  RiGroupLine, 
  RiSearchLine, 
  RiUser3Line, 
  RiDeleteBin6Line, 
  RiShieldUserLine,
  RiCheckLine,
  RiCloseLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'

const AdminUsersPage = () => {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const queryClient = useQueryClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users-list', search, role],
    queryFn: () => adminService.listUsers({ search, role }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('User account deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] })
    },
    onError: () => toast.error('Failed to delete user'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => adminService.toggleUserActive(id),
    onSuccess: () => {
      toast.success('User status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] })
    },
  })

  // Backend returns { total, page, data: [...] }
  const users = usersData?.data || []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiGroupLine className="text-primary-600" /> User & Student Management
        </h1>
        <p className="page-subtitle">Inspect registered students, modify access permissions, and manage user accounts</p>
      </div>

      {/* Search & Filters */}
      <div className="card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, email, or college..."
            className="input pl-10"
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input w-full md:w-44"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>College / Dept</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th className="text-right">Actions</th>
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
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {u.profile_picture ? (
                            <img src={u.profile_picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <RiUser3Line />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                            {u.full_name || 'User'}
                            {u.role === 'admin' && <RiShieldUserLine className="text-primary-600" title="Admin User" />}
                          </div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-gray'}`}>
                        {u.role || 'student'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{u.college || 'Universal Campus'}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActiveMutation.mutate(u.id)}
                          className="btn-icon text-gray-500 hover:text-primary-600"
                          title="Toggle Active Status"
                        >
                          {u.is_active !== false ? <RiCloseLine /> : <RiCheckLine />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          className="btn-icon text-gray-400 hover:text-danger-500"
                          title="Delete User"
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <RiGroupLine className="text-5xl mx-auto mb-2 opacity-30" />
                    No users found matching your query.
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

export default AdminUsersPage
