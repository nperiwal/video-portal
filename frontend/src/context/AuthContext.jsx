import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = "http://localhost:8000"
const AuthContext = createContext(null)

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

let setUserState = null
let setAuthState = null

// Update the axios interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Update response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      delete api.defaults.headers.common['Authorization']
      if (setUserState && setAuthState) {
        setUserState(null)
        setAuthState(false)
      }
    }
    return Promise.reject(error)
  }
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Set the state setters for the interceptor
  setUserState = setUser
  setAuthState = setIsAuthenticated

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = Cookies.get('token')
    if (token) {
      try {
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/api/users/me')
        setUser(response.data)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        Cookies.remove('token')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
        setIsAuthenticated(false)
      }
    } else {
      setUser(null)
      setIsAuthenticated(false)
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user: userData } = response.data
      
      console.log('Login response:', response.data)
      
      // Store token in cookie and update axios headers immediately
      Cookies.set('token', token, { 
        expires: 7, 
        path: '/',
        sameSite: 'Strict',
        secure: window.location.protocol === 'https:'
      })
      
      // Update axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(userData)
      setIsAuthenticated(true)
      
      console.log('Updated state:', { user: userData, isAuthenticated: true })
      
      return userData
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email, password) => {
    const response = await api.post('/api/auth/register', {
      email,
      password
    })
    return response.data
  }

  const logout = () => {
    Cookies.remove('token', { path: '/' })
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    register,
    api,
    setUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 