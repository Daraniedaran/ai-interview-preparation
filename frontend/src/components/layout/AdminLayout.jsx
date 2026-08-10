import { NavLink, useNavigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  RiDashboardLine, RiGroupLine, RiQuestionLine, RiCodeLine,
  RiBuildingLine, RiMicLine, RiBarChartLine, RiSunLine, RiMoonLine,
  RiLogoutBoxLine, RiArrowLeftLine
} from 'react-icons/ri'
import { motion } from 'framer-motion'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: RiDashboardLine },
  { path: '/admin/users', label: 'Users', icon: RiGroupLine },
  { path: '/admin/questions', label: 'Questions', icon: RiQuestionLine },
  { path: '/admin/coding', label: 'Coding Problems', icon: RiCodeLine },
  { path: '/admin/companies', label: 'Companies', icon: RiBuildingLine },
  { path: '/admin/interviews', label: 'Interviews', icon: RiMicLine },
  { path: '/admin/reports', label: 'Reports', icon: RiBarChartLine },
]

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-dark-900 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
              AI
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Admin Panel</h1>
              <p className="text-xs text-gray-500">Interview Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {adminNavItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }`
                }
              >
                <Icon className="text-lg flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-dark-700 space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <RiArrowLeftLine /> Back to Portal
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <RiLogoutBoxLine /> Logout
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Bar */}
        <header className="h-16 bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700 flex items-center px-6 justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Admin Dashboard</h2>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="btn-icon text-gray-600 dark:text-gray-400">
              {isDark ? <RiSunLine className="text-xl" /> : <RiMoonLine className="text-xl" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="avatar w-8 h-8 text-xs">
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.full_name}</span>
              <span className="badge badge-danger text-[10px]">Admin</span>
            </div>
          </div>
        </header>

        {/* Admin Page Content */}
        <motion.main
          className="flex-1 overflow-auto p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}

export default AdminLayout
