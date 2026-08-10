import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authService } from '../../services'
import { motion } from 'framer-motion'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="card shadow-xl text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500">Verifying your email...</p>
        </div>
      )}
      {status === 'success' && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
          <p className="text-gray-500 text-sm mb-6">Your account is now active. You can sign in.</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </motion.div>
      )}
      {status === 'error' && (
        <div>
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
          <p className="text-gray-500 text-sm mb-6">This link is invalid or expired. Please request a new verification email.</p>
          <Link to="/login" className="btn-primary">Back to Login</Link>
        </div>
      )}
    </div>
  )
}

export default VerifyEmailPage
