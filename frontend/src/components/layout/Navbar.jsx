import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { notificationService } from '../../services'
import {
  RiMenuLine, RiSunLine, RiMoonLine, RiBellLine,
  RiSearchLine, RiSettings3Line
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationService.list({ unread_only: true, per_page: 1 }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const unreadCount = notifData?.unread_count || 0

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/questions?search=${encodeURIComponent(searchQuery)}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-20 h-[64px] bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm border-b border-gray-100 dark:border-dark-700 flex items-center px-4 lg:px-6 gap-4">
      {/* Menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="btn-icon lg:hidden text-gray-600 dark:text-gray-400"
      >
        <RiMenuLine className="text-xl" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        {showSearch ? (
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleSearch}
            className="relative"
          >
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setShowSearch(false)}
              placeholder="Search questions, topics, companies..."
              className="input pr-10"
            />
            <RiSearchLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </motion.form>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <RiSearchLine />
            <span className="hidden sm:block">Search questions, topics...</span>
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon text-gray-600 dark:text-gray-400"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <RiSunLine className="text-xl" /> : <RiMoonLine className="text-xl" />}
        </button>

        {/* Notifications */}
        <Link to="/notifications" className="btn-icon relative text-gray-600 dark:text-gray-400">
          <RiBellLine className="text-xl" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Link>

        {/* User Menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <div className="avatar w-8 h-8 text-xs">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
              {user?.full_name?.split(' ')[0]}
            </span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-gray-100 dark:border-dark-700 py-2 z-50"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <RiSettings3Line /> Settings & Profile
                </Link>
                <button
                  onClick={() => { logout(); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default Navbar
