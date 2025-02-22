import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './components/Login'
import Signup from './components/Signup'
import AdminDashboard from './components/AdminDashboard'
import VideoBrowser from './components/VideoBrowser'
import UserProfile from './components/UserProfile'
import PendingApproval from './components/PendingApproval'
import Cookies from 'js-cookie'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }

  // Redirect unapproved users to pending approval page
  if (!user.is_approved && !user.is_admin && window.location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" />
  }
  
  return children
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!user || !user.is_admin) {
    return <Navigate to="/" />
  }
  
  return children
}

const App = () => {
  const { user, setIsAuthenticated, api, isAuthenticated, setUser } = useAuth()

  useEffect(() => {
    const checkToken = async () => {
      const token = Cookies.get('token')
      if (token) {
        try {
          // Set token in headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/api/users/me')
          if (response.data) {
            setUser(response.data)
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error('Token verification failed:', error)
          Cookies.remove('token')
          delete api.defaults.headers.common['Authorization']
        }
      }
    }

    checkToken()
  }, [setIsAuthenticated, api, setUser])

  return (
    <>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/browse" /> : <Login />
          } />
          <Route path="/signup" element={
            isAuthenticated ? <Navigate to="/browse" /> : <Signup />
          } />
          
          {/* Protected Routes */}
          <Route path="/browse" element={
            <PrivateRoute>
              <VideoBrowser />
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />
          
          <Route path="/pending-approval" element={
            <PrivateRoute>
              <PendingApproval />
            </PrivateRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          {/* Default Route */}
          <Route path="/" element={
            <Navigate to={user ? "/browse" : "/login"} />
          } />
        </Routes>
      </Layout>
      <ToastContainer />
    </>
  )
}

export default App 