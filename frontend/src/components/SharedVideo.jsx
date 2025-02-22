import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import VideoPlayer from './VideoPlayer';
import '../styles/SharedVideo.css';

const API_URL = "http://localhost:8000";

const SharedVideo = () => {
  const { shareToken } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideo();
  }, [shareToken]);

  const fetchVideo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/videos/share/${shareToken}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setVideo(response.data);
    } catch (error) {
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!video) {
    return (
      <div className="shared-video-error">
        <h2>Video Not Found</h2>
        <p>This video may have been removed or the link is invalid.</p>
      </div>
    );
  }

  return (
    <div className="shared-video">
      <div className="video-container">
        <h2>{video.title}</h2>
        <VideoPlayer videoUrl={video.url} />
        <p className="video-description">{video.description}</p>
      </div>
    </div>
  );
};

export default SharedVideo; 