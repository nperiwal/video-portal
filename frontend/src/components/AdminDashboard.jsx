import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [newAlbum, setNewAlbum] = useState({ title: '', description: '' });
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    url: '',
    album_id: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
    fetchAlbums();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/api/admin/users/pending');
      console.log('Pending users response:', response.data);
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await api.get('/api/videos/albums');
      console.log('Albums loaded:', response.data);
      setAlbums(response.data);
    } catch (error) {
      toast.error('Failed to fetch albums');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.post(`/api/admin/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/videos/albums', newAlbum);
      toast.success('Album created successfully');
      setNewAlbum({ title: '', description: '' });
      fetchAlbums();
    } catch (error) {
      toast.error('Failed to create album');
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    console.log('Submitting video with data:', newVideo);
    try {
      await api.post('/api/videos/videos', newVideo);
      toast.success('Video added successfully');
      setNewVideo({
        title: '',
        description: '',
        url: '',
        album_id: ''
      });
      fetchAlbums();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <section className="pending-users-section">
        <h3>Pending Users</h3>
        <div className="user-list">
          {pendingUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone_number || 'Not provided'}</p>
                <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <button 
                className="approve-button"
                onClick={() => handleApproveUser(user.id)}
              >
                Approve User
              </button>
            </div>
          ))}
          {pendingUsers.length === 0 && (
            <p className="no-data">No pending users</p>
          )}
        </div>
      </section>

      <section className="content-management">
        <div className="album-form">
          <h2>Create New Album</h2>
          <form onSubmit={handleCreateAlbum}>
            <input
              type="text"
              placeholder="Album Title"
              value={newAlbum.title}
              onChange={(e) => setNewAlbum({...newAlbum, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Album Description"
              value={newAlbum.description}
              onChange={(e) => setNewAlbum({...newAlbum, description: e.target.value})}
            />
            <button type="submit">Create Album</button>
          </form>
        </div>

        <div className="video-form">
          <h2>Add New Video</h2>
          <form onSubmit={handleAddVideo}>
            <input
              type="text"
              placeholder="Video Title"
              value={newVideo.title}
              onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Video Description"
              value={newVideo.description}
              onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
            />
            <input
              type="url"
              placeholder="YouTube Video URL"
              value={newVideo.url}
              onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
              required
            />
            <select
              value={newVideo.album_id}
              onChange={(e) => setNewVideo({...newVideo, album_id: e.target.value})}
              required
            >
              <option value="">Select Album</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
            <button type="submit">Add Video</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard; 