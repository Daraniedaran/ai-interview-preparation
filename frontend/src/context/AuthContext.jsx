import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, userService } from '../services'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load user from stored token on app start
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchCurrentUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await userService.getMe()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authService.login({ email, password })
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    await fetchCurrentUser()
    return response
  }, [fetchCurrentUser])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (_) {
      // Ignore errors on logout
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }, [])

  const register = useCallback(async (data) => {
    const response = await authService.register(data)
    return response
  }, [])

  const refreshUser = useCallback(() => {
    return fetchCurrentUser()
  }, [fetchCurrentUser])

  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isStudent,
        login,
        logout,
        register,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext
