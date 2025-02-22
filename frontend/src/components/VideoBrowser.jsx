import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import VideoPlayer from './VideoPlayer';
import '../styles/VideoBrowser.css';

const VideoBrowser = () => {
  const { api } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/videos/albums');
      setAlbums(response.data);
    } catch (error) {
      console.error('Failed to fetch albums:', error);
      setError('Failed to fetch albums. Please try again later.');
      toast.error('Failed to fetch albums');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (albumId) => {
    try {
      const response = await api.get(`/api/videos/albums/${albumId}/videos`);
      setVideos(response.data);
    } catch (error) {
      toast.error('Failed to fetch videos');
    }
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    fetchVideos(album.id);
    setSelectedVideo(null);
  };

  const handleGenerateShareLink = async (videoId) => {
    try {
      console.log('Generating share link for video:', videoId);
      const response = await api.post(`/api/videos/videos/${videoId}/share`);
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/share/${response.data.share_token}`;
      setShareUrl(shareUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error generating share link:', error.response?.data || error);
      toast.error('Failed to generate share link');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading albums...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!albums.length) {
    return <div className="no-albums">No albums available.</div>;
  }

  return (
    <div className="video-browser">
      <div className="sidebar">
        <h3>Albums</h3>
        <div className="album-list">
          {albums.map(album => (
            <div
              key={album.id}
              className={`album-item ${selectedAlbum?.id === album.id ? 'selected' : ''}`}
              onClick={() => handleAlbumClick(album)}
            >
              <h4>{album.title}</h4>
              <span className="video-count">{album.video_count} videos</span>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        {selectedVideo ? (
          <div className="video-player-container">
            <div className="video-header">
              <h2>{selectedVideo.title}</h2>
              <button 
                className="share-button"
                onClick={() => handleGenerateShareLink(selectedVideo.id)}
              >
                Generate Share Link
              </button>
            </div>
            <VideoPlayer videoUrl={selectedVideo.url} />
            <p className="video-description">{selectedVideo.description}</p>
          </div>
        ) : selectedAlbum ? (
          <div className="video-grid">
            {videos.map(video => (
              <div
                key={video.id}
                className="video-card"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="video-thumbnail">
                  <img 
                    src={`https://img.youtube.com/vi/${video.url.split('v=')[1]}/mqdefault.jpg`}
                    alt={video.title}
                  />
                </div>
                <h4>{video.title}</h4>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Select an album to view videos</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoBrowser; 