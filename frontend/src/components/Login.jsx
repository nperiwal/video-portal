import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import Cookies from 'js-cookie'
import '../styles/Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

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
      const userData = await login(email, password)
      console.log('Login successful:', userData)
      
      toast.success('Login successful!')
      
      // Navigation will be handled by the useEffect above
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
      <form onSubmit={handleSubmit} className="auth-form" style={{ border: '1px solid blue' }}> {/* Debug border */}
        <h2>Login to Video Portal</h2>
        
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
  )
}

export default Login 