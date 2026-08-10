import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services'
import toast from 'react-hot-toast'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setIsLoading(true)
    try {
      await authService.resetPassword(token, password)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed. Link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="card shadow-xl text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Link</h2>
        <p className="text-gray-500 text-sm mb-4">This reset link is invalid or has expired.</p>
        <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
      </div>
    )
  }

  return (
    <div className="card shadow-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reset Password</h1>
      <p className="text-gray-500 text-sm mb-6">Enter your new password below.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="input" id="reset-password" required />
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" className="input" id="reset-confirm" required />
        </div>
        <button type="submit" id="reset-submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 font-semibold">
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}

export default ResetPasswordPage
