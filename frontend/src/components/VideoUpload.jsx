import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const VideoUpload = ({ albumId, onUploadComplete }) => {
  const { api } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.split('.')[0]);
    if (albumId) {
      formData.append('album_id', albumId);
    }

    try {
      setUploading(true);
      const response = await api.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      toast.success('Video uploaded successfully!');
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="video-upload">
      <input
        type="file"
        accept="video/mp4,video/x-m4v,video/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && (
        <div className="upload-progress">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 