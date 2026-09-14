import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  RiStackLine, 
  RiArrowLeftSLine, 
  RiArrowRightSLine, 
  RiCheckLine, 
  RiCloseLine,
  RiLightbulbLine,
  RiAddLine,
  RiDeleteBin6Line
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { flashcardService } from '../../services'

const FlashcardsPage = () => {
  const [flashcards, setFlashcards] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newCard, setNewCard] = useState({ front: '', back: '', topic: '', difficulty: 'Medium' })

  const fetchFlashcards = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedTopic !== 'All') params.topic = selectedTopic
      const data = await flashcardService.list(params)
      setFlashcards(data)
    } catch {
      // Fallback to empty — API may not be running
      setFlashcards([])
    } finally {
      setLoading(false)
    }
  }, [selectedTopic])

  const fetchTopics = useCallback(async () => {
    try {
      const data = await flashcardService.getTopics()
      setTopics(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchFlashcards()
    fetchTopics()
  }, [fetchFlashcards, fetchTopics])

  const card = flashcards[currentIndex]
  const masteredCount = flashcards.filter(c => c.is_mastered).length

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex(prev => (prev < flashcards.length - 1 ? prev + 1 : 0))
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : flashcards.length - 1))
  }

  const handleMaster = async (id) => {
    try {
      await flashcardService.toggleMastered(id)
      fetchFlashcards()
      handleNext()
      toast.success('Marked as mastered!')
    } catch {
      toast.error('Failed to update card')
    }
  }

  const handleReview = async (id) => {
    try {
      await flashcardService.review(id)
      handleNext()
    } catch { /* ignore */ }
  }

  const handleCreate = async () => {
    if (!newCard.front.trim() || !newCard.back.trim()) {
      toast.error('Both question and answer are required')
      return
    }
    try {
      await flashcardService.create(newCard)
      setNewCard({ front: '', back: '', topic: '', difficulty: 'Medium' })
      setShowCreate(false)
      fetchFlashcards()
      fetchTopics()
      toast.success('Flashcard created!')
    } catch {
      toast.error('Failed to create flashcard')
    }
  }

  const handleDelete = async (id) => {
    try {
      await flashcardService.delete(id)
      fetchFlashcards()
      if (currentIndex >= flashcards.length - 1) setCurrentIndex(0)
      toast.success('Flashcard deleted')
    } catch {
      toast.error('Failed to delete flashcard')
    }
  }

  const allTopics = ['All', ...topics]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="page-header text-center">
        <h1 className="page-title flex items-center justify-center gap-2">
          <RiStackLine className="text-primary-600" /> Interactive Study Flashcards
        </h1>
        <p className="page-subtitle">Quick memory revision for core technical topics and interview questions</p>
      </div>

      {/* Top Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap flex-1">
          {allTopics.map(topic => (
            <button
              key={topic}
              onClick={() => {
                setSelectedTopic(topic)
                setCurrentIndex(0)
                setIsFlipped(false)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedTopic === topic
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 border border-gray-100 dark:border-dark-700'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary ml-2">
          <RiAddLine /> New
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="card p-5 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Flashcard</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input col-span-2"
              placeholder="Question / Front"
              value={newCard.front}
              onChange={e => setNewCard({ ...newCard, front: e.target.value })}
            />
            <textarea
              className="input col-span-2"
              rows={3}
              placeholder="Answer / Back"
              value={newCard.back}
              onChange={e => setNewCard({ ...newCard, back: e.target.value })}
            />
            <input
              className="input"
              placeholder="Topic (e.g., Data Structures)"
              value={newCard.topic}
              onChange={e => setNewCard({ ...newCard, topic: e.target.value })}
            />
            <select
              className="input"
              value={newCard.difficulty}
              onChange={e => setNewCard({ ...newCard, difficulty: e.target.value })}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreate} className="btn btn-primary">Create Flashcard</button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card text-center py-12 text-gray-400">
          <RiStackLine className="text-5xl mx-auto mb-2 opacity-30 animate-pulse" />
          <p>Loading flashcards...</p>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <RiStackLine className="text-5xl mx-auto mb-2 opacity-30" />
          <p>No flashcards yet. Create your first one!</p>
        </div>
      ) : card ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-mono text-gray-400">
            <span>Card {currentIndex + 1} of {flashcards.length}</span>
            <span>{masteredCount} Mastered</span>
          </div>

          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer perspective-1000"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="card min-h-[260px] flex flex-col justify-between items-center text-center p-8 border-2 border-primary-100 dark:border-dark-700 hover:border-primary-300 dark:hover:border-dark-600 shadow-lg relative bg-gradient-to-b from-white to-gray-50/50 dark:from-dark-800 dark:to-dark-900"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {!isFlipped ? (
                <div className="w-full my-auto space-y-4">
                  <div className="badge badge-primary font-mono text-xs uppercase tracking-wider mx-auto">
                    {card.topic || 'Question'}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                    {card.front}
                  </h2>
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <RiLightbulbLine className="text-amber-500" /> Click anywhere to reveal answer
                  </p>
                </div>
              ) : (
                <div 
                  className="w-full my-auto space-y-4"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="badge badge-success font-mono text-xs uppercase tracking-wider mx-auto">
                    Answer / Explanation
                  </div>
                  <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    {card.back}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={handlePrev} 
              className="btn btn-secondary"
            >
              <RiArrowLeftSLine /> Previous
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleReview(card.id)}
                className="btn bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
              >
                <RiCloseLine className="text-danger-500" /> Still Reviewing
              </button>
              <button
                onClick={() => handleMaster(card.id)}
                className={`btn ${card.is_mastered ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'btn-success'}`}
              >
                <RiCheckLine /> {card.is_mastered ? 'Mastered ✓' : 'Got It!'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(card.id) }}
                className="btn bg-gray-200 dark:bg-dark-700 text-danger-500 hover:bg-danger-50"
                title="Delete this card"
              >
                <RiDeleteBin6Line />
              </button>
            </div>

            <button 
              onClick={handleNext} 
              className="btn btn-secondary"
            >
              Next <RiArrowRightSLine />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FlashcardsPage
