import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiDashboardLine, RiUserLine, RiFileTextLine, RiBrainLine,
  RiCodeLine, RiMicLine, RiBuildingLine, RiQuestionLine,
  RiTrophyLine, RiBarChartLine, RiMedalLine, RiNotification3Line,
  RiStickyNoteLine, RiTimeLine, RiFlashlightLine,
  RiDiscussLine, RiLogoutBoxLine, RiShieldLine
} from 'react-icons/ri'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { path: '/profile', label: 'Profile', icon: RiUserLine },
  { path: '/resume', label: 'Resume Review', icon: RiFileTextLine },
  { divider: true, label: 'Practice' },
  { path: '/aptitude', label: 'Aptitude', icon: RiBrainLine },
  { path: '/coding', label: 'Coding', icon: RiCodeLine },
  { path: '/interview', label: 'Mock Interview', icon: RiMicLine },
  { path: '/companies', label: 'Companies', icon: RiBuildingLine },
  { path: '/questions', label: 'Question Bank', icon: RiQuestionLine },
  { divider: true, label: 'Progress' },
  { path: '/leaderboard', label: 'Leaderboard', icon: RiTrophyLine },
  { path: '/progress', label: 'Progress', icon: RiBarChartLine },
  { path: '/achievements', label: 'Achievements', icon: RiMedalLine },
  { path: '/notifications', label: 'Notifications', icon: RiNotification3Line },
  { divider: true, label: 'Tools' },
  { path: '/flashcards', label: 'Flashcards', icon: RiFlashlightLine },
  { path: '/notes', label: 'Notes', icon: RiStickyNoteLine },
  { path: '/study-planner', label: 'Study Planner', icon: RiTimeLine },
  { path: '/discussion', label: 'Discussion', icon: RiDiscussLine },
]

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
            AI
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
              Interview Portal
            </h1>
            <p className="text-xs text-gray-400">AI-Powered Prep</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-dark-700">
          <div className="avatar w-9 h-9 text-sm">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={idx} className="pt-4 pb-1 first:pt-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4">
                  {item.label}
                </p>
              </div>
            )
          }
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* Admin Link */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4">Admin</p>
            </div>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <RiShieldLine className="text-lg" />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100 dark:border-dark-700">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 hover:text-danger-600"
        >
          <RiLogoutBoxLine className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-[260px] bg-white dark:bg-dark-800 border-r border-gray-100 dark:border-dark-700 z-30 flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-full w-[260px] bg-white dark:bg-dark-800 border-r border-gray-100 dark:border-dark-700 z-30 flex flex-col"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
