import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Cookies from 'js-cookie'
import '../styles/Auth.css'
import '../styles/Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the return path and message from location state
  const from = location.state?.from || '/';
  const message = location.state?.message;

  useEffect(() => {
    console.log('Login component mounted') // Debug log
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting...', user)
      if (user.is_admin) {
        navigate('/admin')
      } else if (!user.phone_number) {
        navigate('/profile')
      } else if (!user.is_approved) {
        navigate('/pending-approval')
      } else {
        navigate('/browse')
      }
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submitted')
    setIsLoading(true)
    
    try {
      await login(email, password)
      
      // Show message if provided
      if (message) {
        toast.info(message)
      }

      // Navigate to the return path
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.detail || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated && user) {
    return null
  }

  return (
    <div className="auth-container" style={{ border: '1px solid red' }}> {/* Debug border */}
      <div className="login-card">
        <h2>Login to Video Portal</h2>
        {message && (
          <div className="login-message">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form" style={{ border: '1px solid blue' }}> {/* Debug border */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="auth-links">
            <a href="/signup">Don't have an account? Sign up</a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 