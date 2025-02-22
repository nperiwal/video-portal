import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../test/test-utils'
import SharedVideo from '../components/SharedVideo'
import { useParams } from 'react-router-dom'

vi.mock('react-router-dom', () => ({
  useParams: vi.fn()
}))

describe('SharedVideo', () => {
  it('loads and displays shared video', async () => {
    useParams.mockReturnValue({ shareToken: 'test-token' })
    
    const mockVideo = {
      title: 'Test Video',
      description: 'Test Description',
      url: 'https://youtube.com/watch?v=test123'
    }

    const mockApi = {
      get: vi.fn().mockResolvedValue({ data: mockVideo })
    }

    render(<SharedVideo />, { api: mockApi })

    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })
  })

  it('shows error message when video not found', async () => {
    useParams.mockReturnValue({ shareToken: 'invalid-token' })
    
    const mockApi = {
      get: vi.fn().mockRejectedValue(new Error('Video not found'))
    }

    render(<SharedVideo />, { api: mockApi })

    await waitFor(() => {
      expect(screen.getByText('Video Not Found')).toBeInTheDocument()
    })
  })
}) 