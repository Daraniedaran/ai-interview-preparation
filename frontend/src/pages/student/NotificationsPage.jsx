import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../../services'
import { motion } from 'framer-motion'
import { 
  RiNotification3Line, 
  RiCheckDoubleLine, 
  RiDeleteBin6Line, 
  RiInformationLine,
  RiAwardLine,
  RiFeedbackLine,
  RiTimeLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'

const notificationIcons = {
  interview: RiFeedbackLine,
  achievement: RiAwardLine,
  system: RiInformationLine,
}

const NotificationsPage = () => {
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-list', filter],
    queryFn: () => notificationService.list({ unread_only: filter === 'unread' }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => {
      toast.success('Notification removed')
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
    },
  })

  // Backend returns { notifications: [...], total, unread_count }
  const listData = notifications?.notifications || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiNotification3Line className="text-primary-600" /> Notifications & Activity Updates
          </h1>
          <p className="page-subtitle">Stay updated on mock interview evaluations, reminders, and platform activity</p>
        </div>

        <button
          onClick={() => markAllReadMutation.mutate()}
          className="btn btn-secondary text-xs"
          disabled={listData.length === 0}
        >
          <RiCheckDoubleLine /> Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'all' 
              ? 'bg-primary-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'unread' 
              ? 'bg-primary-600 text-white shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notification Items */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-4 skeleton w-1/3" />
              <div className="h-3 skeleton w-2/3" />
            </div>
          ))
        ) : listData.length > 0 ? (
          listData.map((item) => {
            const IconComponent = notificationIcons[item.notification_type] || notificationIcons[item.type] || RiInformationLine
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`card p-4 flex items-start gap-4 transition-all ${
                  !item.is_read 
                    ? 'border-l-4 border-l-primary-600 bg-primary-50/20 dark:bg-primary-950/10' 
                    : 'opacity-85'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-lg flex-shrink-0">
                  <IconComponent />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <RiTimeLine /> {new Date(item.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {item.message || item.body}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!item.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(item.id)}
                      className="btn-icon text-primary-600 hover:bg-primary-50 dark:hover:bg-dark-700"
                      title="Mark as read"
                    >
                      <RiCheckDoubleLine />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="btn-icon text-gray-400 hover:text-danger-500"
                    title="Delete"
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="card text-center py-12 text-gray-400">
            <RiNotification3Line className="text-5xl mx-auto mb-2 opacity-30" />
            <p>No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
