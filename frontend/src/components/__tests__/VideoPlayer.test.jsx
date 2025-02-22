import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import VideoPlayer from '../components/VideoPlayer'

describe('VideoPlayer', () => {
  it('renders iframe with correct YouTube URL', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=test123'
    render(<VideoPlayer videoUrl={videoUrl} />)
    
    const iframe = screen.getByTitle('YouTube video player')
    expect(iframe).toBeInTheDocument()
    expect(iframe.src).toContain('youtube.com/embed/test123')
  })

  it('handles different YouTube URL formats', () => {
    const urls = [
      'https://youtu.be/test123',
      'https://www.youtube.com/watch?v=test123',
      'https://youtube.com/watch?v=test123'
    ]

    urls.forEach(url => {
      render(<VideoPlayer videoUrl={url} />)
      const iframe = screen.getByTitle('YouTube video player')
      expect(iframe.src).toContain('youtube.com/embed/test123')
    })
  })
}) 