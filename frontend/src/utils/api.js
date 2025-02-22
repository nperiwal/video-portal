import Cookies from 'js-cookie'

export const getAuthToken = () => {
  return Cookies.get('token')
}

export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken()
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token expired or invalid
    Cookies.remove('token')
    window.location.href = '/login'
    return
  }

  return response
} 