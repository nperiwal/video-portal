import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/test-utils'
import userEvent from '@testing-library/user-event'
import AdminDashboard from '../components/AdminDashboard'

describe('AdminDashboard', () => {
  it('renders all form elements', () => {
    render(<AdminDashboard />)
    
    // Album form elements
    expect(screen.getByPlaceholderText('Album Title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Album Description')).toBeInTheDocument()
    
    // Video form elements
    expect(screen.getByPlaceholderText('Video Title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Video Description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('YouTube Video URL')).toBeInTheDocument()
  })

  it('creates an album successfully', async () => {
    const user = userEvent.setup()
    const mockApi = {
      post: vi.fn().mockResolvedValue({ data: { id: '1', title: 'Test Album' } }),
      get: vi.fn().mockResolvedValue({ data: [] })
    }
    
    render(<AdminDashboard />, { api: mockApi })
    
    await user.type(screen.getByPlaceholderText('Album Title'), 'Test Album')
    await user.type(screen.getByPlaceholderText('Album Description'), 'Test Description')
    
    const createButton = screen.getByText('Create Album')
    await user.click(createButton)
    
    expect(mockApi.post).toHaveBeenCalledWith('/api/videos/albums', {
      title: 'Test Album',
      description: 'Test Description'
    })
  })

  it('creates a video successfully', async () => {
    const user = userEvent.setup()
    const mockApi = {
      post: vi.fn().mockResolvedValue({ 
        data: { 
          id: '1', 
          title: 'Test Video',
          album_id: 'album1'
        } 
      }),
      get: vi.fn().mockResolvedValue({ 
        data: [{ id: 'album1', title: 'Test Album' }] 
      })
    }
    
    render(<AdminDashboard />, { api: mockApi })
    
    await user.type(screen.getByPlaceholderText('Video Title'), 'Test Video')
    await user.type(screen.getByPlaceholderText('Video Description'), 'Test Description')
    await user.type(screen.getByPlaceholderText('YouTube Video URL'), 'https://youtube.com/watch?v=test')
    await user.selectOptions(screen.getByRole('combobox'), 'album1')
    
    const addButton = screen.getByText('Add Video')
    await user.click(addButton)
    
    expect(mockApi.post).toHaveBeenCalledWith('/api/videos/videos', {
      title: 'Test Video',
      description: 'Test Description',
      url: 'https://youtube.com/watch?v=test',
      album_id: 'album1'
    })
  })

  it('shows error toast when album creation fails', async () => {
    const user = userEvent.setup()
    const mockApi = {
      post: vi.fn().mockRejectedValue(new Error('Failed to create album')),
      get: vi.fn().mockResolvedValue({ data: [] })
    }
    
    render(<AdminDashboard />, { api: mockApi })
    
    await user.type(screen.getByPlaceholderText('Album Title'), 'Test Album')
    const createButton = screen.getByText('Create Album')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create album')).toBeInTheDocument()
    })
  })
}) 