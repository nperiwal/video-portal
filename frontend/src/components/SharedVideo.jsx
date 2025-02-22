import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from './VideoPlayer';
import { toast } from 'react-toastify';
import '../styles/SharedVideo.css';

const SharedVideo = () => {
  const { shareToken } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { api, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        console.log('Fetching video with share token:', shareToken);
        const response = await api.get(`/api/videos/share/${shareToken}`);
        console.log('Video data:', response.data);
        setVideo(response.data);
      } catch (error) {
        console.error('Error fetching video:', error);
        toast.error('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (shareToken && user) {
      fetchVideo();
    } else {
      setLoading(false);
    }
  }, [shareToken, api, user]);

  if (!user) {
    // Redirect to login with return path
    return <Navigate 
      to="/login" 
      state={{ 
        from: location.pathname,
        message: "Please log in to view this shared video"
      }} 
      replace 
    />;
  }

  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (!video) {
    return (
      <div className="error">
        <h2>Video Not Found</h2>
        <p>This video may have been removed or the link is invalid.</p>
      </div>
    );
  }

  return (
    <div className="shared-video-container">
      <div className="video-content">
        <h1>{video.title}</h1>
        <VideoPlayer videoUrl={video.url} />
        <p className="description">{video.description}</p>
      </div>
    </div>
  );
};

export default SharedVideo; 