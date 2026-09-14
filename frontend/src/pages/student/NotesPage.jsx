import { useState, useEffect, useCallback } from 'react'
import { 
  RiBookmarkLine, 
  RiAddLine, 
  RiSearchLine, 
  RiDeleteBin6Line, 
  RiEditLine, 
  RiPriceTag3Line,
  RiSaveLine,
  RiCloseLine,
  RiPushpin2Line,
  RiPushpin2Fill
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { noteService } from '../../services'

const NotesPage = () => {
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formTopic, setFormTopic] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formTags, setFormTags] = useState('')

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search
      const data = await noteService.list(params)
      setNotes(data)
      // Auto-select first note if none selected
      setSelectedNote((prev) => (prev ? prev : data.length > 0 ? data[0] : prev))
    } catch {
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleOpenNewNote = () => {
    setSelectedNote(null)
    setFormTitle('')
    setFormTopic('General')
    setFormContent('')
    setFormTags('')
    setIsEditing(true)
  }

  const handleOpenEdit = (note) => {
    setSelectedNote(note)
    setFormTitle(note.title)
    setFormTopic(note.topic || '')
    setFormContent(note.content || '')
    setFormTags(note.tags || '')
    setIsEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Please fill in title and content')
      return
    }

    try {
      if (selectedNote) {
        // Update existing
        const updated = await noteService.update(selectedNote.id, {
          title: formTitle,
          content: formContent,
          topic: formTopic,
          tags: formTags,
        })
        setSelectedNote(updated)
        toast.success('Note updated successfully')
      } else {
        // Create new
        const newNote = await noteService.create({
          title: formTitle,
          content: formContent,
          topic: formTopic,
          tags: formTags,
        })
        setSelectedNote(newNote)
        toast.success('New note created')
      }
      setIsEditing(false)
      fetchNotes()
    } catch {
      toast.error('Failed to save note')
    }
  }

  const handleDelete = async (id) => {
    try {
      await noteService.delete(id)
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
      fetchNotes()
      toast.success('Note deleted')
    } catch {
      toast.error('Failed to delete note')
    }
  }

  const handleTogglePin = async (id) => {
    try {
      const updated = await noteService.togglePin(id)
      if (selectedNote?.id === id) {
        setSelectedNote(updated)
      }
      fetchNotes()
      toast.success(updated.is_pinned ? 'Note pinned' : 'Note unpinned')
    } catch {
      toast.error('Failed to update note')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const parseTags = (tagStr) => {
    if (!tagStr) return []
    return tagStr.split(',').map(t => t.trim()).filter(Boolean)
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiBookmarkLine className="text-primary-600" /> Personal Study Notes
          </h1>
          <p className="page-subtitle">Organize code snippets, interview cheat sheets, and key takeaways</p>
        </div>

        <button onClick={handleOpenNewNote} className="btn btn-primary">
          <RiAddLine /> Create New Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Notes Sidebar List */}
        <div className="card space-y-4">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="input pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center py-8 text-xs text-gray-400 animate-pulse">Loading notes...</p>
            ) : notes.length > 0 ? (
              notes.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    setSelectedNote(n)
                    setIsEditing(false)
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedNote?.id === n.id
                      ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-950/20'
                      : 'border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5">
                      {n.is_pinned && <RiPushpin2Fill className="text-primary-500 text-xs" />}
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{n.title}</h4>
                    </div>
                    <span className="badge badge-gray text-[10px]">{n.topic || 'General'}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{n.content}</p>
                  <div className="text-[10px] text-gray-400 mt-2 font-mono">{formatDate(n.updated_at)}</div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-xs text-gray-400">No notes found. Create your first one!</p>
            )}
          </div>
        </div>

        {/* Note View / Edit Panel */}
        <div className="card lg:col-span-2 min-h-[450px]">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-dark-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {selectedNote ? 'Edit Note' : 'Create New Note'}
                </h3>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-icon">
                  <RiCloseLine />
                </button>
              </div>

              <div>
                <label className="label">Note Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Dynamic Programming Optimization Hacks"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Topic</label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Algorithms"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="dp, recursion, memory"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Content / Markdown Notes</label>
                <textarea
                  rows={10}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your detailed study points here..."
                  className="input font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <RiSaveLine /> Save Note
                </button>
              </div>
            </form>
          ) : selectedNote ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-dark-700">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-primary">{selectedNote.topic || 'General'}</span>
                    <span className="text-xs font-mono text-gray-400">Updated: {formatDate(selectedNote.updated_at)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNote.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleTogglePin(selectedNote.id)} className="btn btn-secondary btn-sm" title={selectedNote.is_pinned ? 'Unpin' : 'Pin'}>
                    {selectedNote.is_pinned ? <RiPushpin2Fill className="text-primary-500" /> : <RiPushpin2Line />}
                  </button>
                  <button onClick={() => handleOpenEdit(selectedNote)} className="btn btn-secondary btn-sm">
                    <RiEditLine /> Edit
                  </button>
                  <button onClick={() => handleDelete(selectedNote.id)} className="btn btn-danger btn-sm">
                    <RiDeleteBin6Line /> Delete
                  </button>
                </div>
              </div>

              {parseTags(selectedNote.tags).length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {parseTags(selectedNote.tags).map(tag => (
                    <span key={tag} className="badge badge-gray flex items-center gap-1 text-[11px]">
                      <RiPriceTag3Line className="text-xs" /> {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-dark-900/60 p-4 rounded-xl font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
                {selectedNote.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 space-y-2">
              <RiBookmarkLine className="text-5xl mx-auto opacity-30" />
              <p>Select a note from the left list or create a new note.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotesPage
