import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  RiCalendarEventLine, 
  RiCheckLine, 
  RiAddLine, 
  RiDeleteBin6Line, 
  RiTimeLine,
  RiCheckDoubleLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { studyPlannerService } from '../../services'

const StudyPlannerPage = () => {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Coding')
  const [filterCategory, setFilterCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterCategory !== 'All') params.category = filterCategory
      const data = await studyPlannerService.listTasks(params)
      setTasks(data)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [filterCategory])

  const fetchStats = useCallback(async () => {
    try {
      const data = await studyPlannerService.getStats()
      setStats(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [fetchTasks, fetchStats])

  const toggleTask = async (id) => {
    try {
      const updated = await studyPlannerService.toggleTask(id)
      setTasks(tasks.map(t => t.id === id ? updated : t))
      fetchStats()
      toast.success(updated.completed ? 'Task completed! 🎉' : 'Task unchecked')
    } catch {
      toast.error('Failed to update task')
    }
  }

  const deleteTask = async (id) => {
    try {
      await studyPlannerService.deleteTask(id)
      setTasks(tasks.filter(t => t.id !== id))
      fetchStats()
      toast.success('Task removed')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    try {
      const newTask = await studyPlannerService.createTask({
        text: newTaskText,
        category: newTaskCategory,
        date: 'Today',
      })
      setTasks([newTask, ...tasks])
      setNewTaskText('')
      fetchStats()
      toast.success('Task added to planner')
    } catch {
      toast.error('Failed to add task')
    }
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiCalendarEventLine className="text-primary-600" /> Placement Study Planner & Daily Roadmap
          </h1>
          <p className="page-subtitle">Stay disciplined with structured daily targets and countdown milestones</p>
        </div>

        <div className="card py-3 px-5 border-primary-200 dark:border-dark-700 bg-primary-50/20 dark:bg-primary-950/20 flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400">
              {stats ? `${stats.completion_rate}%` : `${progressPercent}%`} Completed
            </div>
            <div className="text-xs text-gray-500">
              {stats ? `${stats.completed} of ${stats.total}` : `${completedCount} of ${tasks.length}`} Tasks
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-primary-600 flex items-center justify-center font-bold text-xs">
            {stats ? `${stats.completed}/${stats.total}` : `${completedCount}/${tasks.length}`}
          </div>
        </div>
      </div>

      {/* Add Task Bar */}
      <form onSubmit={handleAddTask} className="card flex flex-col sm:flex-row gap-3 items-center">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new preparation task (e.g., Practice 3 SQL Joins)..."
          className="input flex-1"
        />

        <select
          value={newTaskCategory}
          onChange={(e) => setNewTaskCategory(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="Coding">Coding</option>
          <option value="Aptitude">Aptitude</option>
          <option value="Interview">Interview</option>
          <option value="Resume">Resume</option>
          <option value="Revision">Revision</option>
        </select>

        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          <RiAddLine /> Add Task
        </button>
      </form>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Coding', 'Aptitude', 'Interview', 'Resume', 'Revision'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filterCategory === cat
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center py-12 text-gray-400 animate-pulse">
            <RiCalendarEventLine className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card p-4 flex items-center justify-between gap-4 transition-all ${
                task.completed ? 'bg-gray-50/60 dark:bg-dark-900/40 opacity-75' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    task.completed 
                      ? 'bg-success-500 border-success-500 text-white' 
                      : 'border-gray-300 dark:border-dark-600 hover:border-primary-500'
                  }`}
                >
                  {task.completed && <RiCheckLine className="text-sm font-bold" />}
                </button>

                <div className="space-y-0.5">
                  <p className={`text-sm font-medium ${
                    task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                  }`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-gray text-[10px]">{task.category}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <RiTimeLine /> {task.date || 'Today'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="btn-icon text-gray-400 hover:text-danger-500"
              >
                <RiDeleteBin6Line />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="card text-center py-12 text-gray-400">
            <RiCheckDoubleLine className="text-5xl mx-auto mb-2 opacity-30" />
            <p>{filterCategory === 'All' ? 'No tasks yet. Add your first study task!' : 'No tasks found in this category.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyPlannerPage
