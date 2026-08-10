import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import { RiMailLine, RiArrowLeftLine } from 'react-icons/ri'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Reset link sent!')
    } catch (err) {
      toast.error('Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="card shadow-xl text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          We sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder).
        </p>
        <Link to="/login" className="btn-primary w-full justify-center">Back to Login</Link>
      </div>
    )
  }

  return (
    <div className="card shadow-xl">
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <RiArrowLeftLine /> Back to login
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot password?</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your email and we'll send a reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-10"
              id="forgot-email"
              required
            />
          </div>
        </div>
        <button type="submit" id="forgot-submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 font-semibold">
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}

export default ForgotPasswordPage
