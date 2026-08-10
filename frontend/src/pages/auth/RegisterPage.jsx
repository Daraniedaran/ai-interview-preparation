import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  RiUserLine, RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine,
  RiPhoneLine, RiBuildingLine, RiArrowRightLine
} from 'react-icons/ri'

const schema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  phone: z.string().optional(),
  college: z.string().optional(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

const RegisterPage = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    const { confirm_password, ...payload } = data
    try {
      await registerUser(payload)
      toast.success('Account created! Check your email to verify. 🎉')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card shadow-xl">
      <div className="text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">AI</div>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your interview prep journey today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name & Username row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input {...register('full_name')} placeholder="John Doe" className={`input pl-9 text-sm ${errors.full_name ? 'input-error' : ''}`} id="reg-fullname" />
            </div>
            {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="label">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input {...register('username')} placeholder="john_doe" className={`input pl-8 text-sm ${errors.username ? 'input-error' : ''}`} id="reg-username" />
            </div>
            {errors.username && <p className="error-text">{errors.username.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input {...register('email')} type="email" placeholder="you@example.com" className={`input pl-10 ${errors.email ? 'input-error' : ''}`} id="reg-email" />
          </div>
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={`input pl-9 pr-9 text-sm ${errors.password ? 'input-error' : ''}`} id="reg-password" />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <RiEyeOffLine className="text-sm" /> : <RiEyeLine className="text-sm" />}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input {...register('confirm_password')} type="password" placeholder="••••••••" className={`input pl-9 text-sm ${errors.confirm_password ? 'input-error' : ''}`} id="reg-confirm" />
            </div>
            {errors.confirm_password && <p className="error-text">{errors.confirm_password.message}</p>}
          </div>
        </div>

        {/* Phone & College */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input {...register('phone')} placeholder="+91 9876543210" className="input pl-9 text-sm" id="reg-phone" />
            </div>
          </div>
          <div>
            <label className="label">College <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <RiBuildingLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input {...register('college')} placeholder="IIT Bombay" className="input pl-9 text-sm" id="reg-college" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          id="register-submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-3 font-semibold group mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </div>
          ) : (
            <>
              Create Account Free
              <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export default RegisterPage
