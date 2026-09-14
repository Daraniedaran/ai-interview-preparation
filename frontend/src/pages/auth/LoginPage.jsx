import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiArrowRightLine } from 'react-icons/ri'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const fillDemo = (email, password) => {
    setValue('email', email)
    setValue('password', password)
    toast('Credentials filled — hit Sign In', { icon: '✍️' })
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      toast.success('Welcome back! 🎉')
      navigate(result.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card shadow-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">AI</div>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to continue your prep journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              id="login-email"
            />
          </div>
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              id="login-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="login-submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-3 text-base font-semibold group"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            <>
              Sign In
              <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials */}
      <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Demo Credentials — click to autofill</p>
        <button
          type="button"
          onClick={() => fillDemo('alice@example.com', 'Student@123')}
          className="w-full text-left text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:underline py-0.5"
        >
          Student: alice@example.com / Student@123
        </button>
        <button
          type="button"
          onClick={() => fillDemo('admin@aiinterview.com', 'Admin@123')}
          className="w-full text-left text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 hover:underline py-0.5"
        >
          Admin: admin@aiinterview.com / Admin@123
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
