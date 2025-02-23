import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from './VideoPlayer';
import '../styles/SharedVideo.css';

const SharedVideo = () => {
  const { shareToken } = useParams();
  const { api, user } = useAuth();
  const location = useLocation();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/videos/share/${shareToken}`);
        setVideo(response.data);
      } catch (error) {
        console.error('Error fetching video:', error);
        if (error.response?.status === 403) {
          setError({
            title: "Account Pending Approval",
            message: "Your account is pending approval. You will be able to watch videos once an admin approves your account.",
            type: "pending"
          });
        } else {
          setError({
            title: "Error Loading Video",
            message: error.response?.data?.detail || "Failed to load video",
            type: "error"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVideo();
    }
  }, [shareToken, api, user]);

  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname,
          message: "Please log in to watch this video"
        }} 
        replace 
      />
    );
  }

  if (user && !user.is_approved && !user.is_admin) {
    return (
      <div className="error-container pending">
        <h2>Account Pending Approval</h2>
        <p>Your account is pending approval. You will be able to watch videos once an admin approves your account.</p>
        <div className="pending-info">
          <p>Please wait for an admin to approve your account.</p>
          <p>You will receive an email notification once your account is approved.</p>
        </div>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (error) {
    return (
      <div className={`error-container ${error.type}`}>
        <h2>{error.title}</h2>
        <p>{error.message}</p>
        {error.type === "pending" && (
          <div className="pending-info">
            <p>Please wait for an admin to approve your account.</p>
            <p>You will receive an email notification once your account is approved.</p>
          </div>
        )}
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    );
  }

  if (!video) {
    return <div className="error">Video not found</div>;
  }

  return (
    <div className="shared-video">
      <div className="video-content">
        <h1>{video.title}</h1>
        <VideoPlayer videoUrl={video.url} />
        {video.description && (
          <p className="description">{video.description}</p>
        )}
      </div>
    </div>
  );
};

export default SharedVideo; 