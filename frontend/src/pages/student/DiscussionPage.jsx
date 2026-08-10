import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  RiDiscussLine, 
  RiAddLine, 
  RiThumbUpLine, 
  RiChat3Line, 
  RiUser3Line, 
  RiSearchLine,
  RiSendPlaneLine,
  RiCloseLine,
  RiDeleteBin6Line
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { discussionService } from '../../services'
import { useAuth } from '../../context/AuthContext'

const DiscussionPage = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [replyInput, setReplyInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [postComments, setPostComments] = useState({}) // { postId: [comments] }

  // New post form
  const [newTitle, setNewTitle] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTopic, setNewTopic] = useState('')

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search
      const data = await discussionService.listPosts(params)
      setPosts(data.posts || [])
      setTotal(data.total || 0)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required')
      return
    }

    try {
      await discussionService.createPost({
        title: newTitle,
        content: newContent,
        topic: newTopic || null,
        tags: newTags || null,
      })
      setShowNewModal(false)
      setNewTitle('')
      setNewTags('')
      setNewContent('')
      setNewTopic('')
      fetchPosts()
      toast.success('Post published!')
    } catch {
      toast.error('Failed to create post')
    }
  }

  const handleUpvote = async (id) => {
    try {
      const result = await discussionService.likePost(id)
      setPosts(posts.map(p => p.id === id ? { ...p, like_count: result.like_count } : p))
    } catch {
      toast.error('Failed to like post')
    }
  }

  const handleDeletePost = async (id) => {
    try {
      await discussionService.deletePost(id)
      fetchPosts()
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const loadComments = async (postId) => {
    if (activeReplyId === postId) {
      setActiveReplyId(null)
      return
    }
    try {
      const postData = await discussionService.getPost(postId)
      setPostComments(prev => ({ ...prev, [postId]: postData.comments || [] }))
      setActiveReplyId(postId)
    } catch {
      toast.error('Failed to load comments')
    }
  }

  const handleAddReply = async (postId) => {
    if (!replyInput.trim()) return
    try {
      const newComment = await discussionService.addComment(postId, { content: replyInput })
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }))
      // Update comment count in post list
      setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p))
      setReplyInput('')
      toast.success('Reply added!')
    } catch {
      toast.error('Failed to add reply')
    }
  }

  const handleDeleteComment = async (commentId, postId) => {
    try {
      await discussionService.deleteComment(commentId)
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
      }))
      setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const parseTags = (tagStr) => {
    if (!tagStr) return []
    return tagStr.split(',').map(t => t.trim()).filter(Boolean)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiDiscussLine className="text-primary-600" /> Student Discussion & Placement Community
          </h1>
          <p className="page-subtitle">Share interview experiences, ask doubts, and discuss strategies</p>
        </div>

        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <RiAddLine /> Start a Discussion
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussion threads..."
            className="input pl-10"
          />
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {total} discussion{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center py-12 text-gray-400 animate-pulse">
            <RiDiscussLine className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Loading discussions...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <RiDiscussLine className="text-5xl mx-auto mb-2 opacity-30" />
            <p>No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          posts.map(post => (
            <motion.div key={post.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <RiUser3Line />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{post.author_name || 'Anonymous'}</h4>
                    <div className="text-xs text-gray-400">{formatTime(post.created_at)}</div>
                  </div>
                </div>

                <div className="flex gap-1 items-center">
                  {parseTags(post.tags).map(t => (
                    <span key={t} className="badge badge-gray text-[10px]">{t}</span>
                  ))}
                  {post.user_id === user?.id && (
                    <button 
                      onClick={() => handleDeletePost(post.id)} 
                      className="ml-2 text-gray-400 hover:text-danger-500 transition-colors"
                      title="Delete post"
                    >
                      <RiDeleteBin6Line className="text-sm" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{post.content}</p>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-dark-700 text-xs font-medium">
                <button 
                  onClick={() => handleUpvote(post.id)}
                  className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <RiThumbUpLine /> {post.like_count || 0} Upvotes
                </button>

                <button 
                  onClick={() => loadComments(post.id)}
                  className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <RiChat3Line /> {post.comment_count || 0} Replies
                </button>

                {post.view_count > 0 && (
                  <span className="text-gray-400 ml-auto">{post.view_count} views</span>
                )}
              </div>

              {/* Replies Thread */}
              {activeReplyId === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700/60 space-y-3 bg-gray-50 dark:bg-dark-900/40 p-4 rounded-xl">
                  <div className="space-y-2">
                    {(postComments[post.id] || []).map(reply => (
                      <div key={reply.id} className="text-xs space-y-1 pb-2 border-b border-gray-200/50 dark:border-dark-700/50 last:border-0">
                        <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                          <span>{reply.author_name || 'Anonymous'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{formatTime(reply.created_at)}</span>
                            {reply.user_id === user?.id && (
                              <button
                                onClick={() => handleDeleteComment(reply.id, post.id)}
                                className="text-gray-400 hover:text-danger-500"
                              >
                                <RiDeleteBin6Line />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{reply.content}</p>
                      </div>
                    ))}
                    {(postComments[post.id] || []).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">No replies yet. Be the first!</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddReply(post.id)}
                      placeholder="Write a helpful reply..."
                      className="input text-xs"
                    />
                    <button onClick={() => handleAddReply(post.id)} className="btn btn-primary btn-sm">
                      <RiSendPlaneLine />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* New Post Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Start New Discussion</h3>
              <button onClick={() => setShowNewModal(false)} className="btn-icon">
                <RiCloseLine />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Google Coding Interview Round Experience"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Topic</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Interview Experience"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Google, Coding, Round1"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Content</label>
                <textarea
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Describe your questions or experience in detail..."
                  className="input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Post Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscussionPage
