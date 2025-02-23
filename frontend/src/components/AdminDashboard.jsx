import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/AdminDashboard.css';

const UserManagement = ({ 
  adminUsers, 
  pendingUsers, 
  approvedUsers, 
  loading, 
  handleApproveUser, 
  handleToggleAdmin, 
  currentUser,
  sortUsersByDate 
}) => {
  return (
    <div className="user-management">
      <section className="admin-users-section">
        <h3>Admin Users ({adminUsers.length})</h3>
        <div className="user-list">
          {loading ? (
            <p className="loading">Loading admin users...</p>
          ) : sortUsersByDate(adminUsers).map(user => {
            const isCurrentUser = currentUser && user.email === currentUser.email;
            return (
              <div key={user.id} className="user-card admin">
                <div className="user-info">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Phone:</strong> {user.phone_number || 'Not provided'}</p>
                  <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                  <div className="user-status">
                    <span className="admin-badge">Admin</span>
                    {isCurrentUser && (
                      <span className="current-user-badge">Current User</span>
                    )}
                  </div>
                </div>
                <button
                  className="admin-toggle-button revoke"
                  onClick={() => handleToggleAdmin(user.id)}
                  disabled={isCurrentUser}
                  title={isCurrentUser ? "Cannot revoke your own admin status" : ""}
                >
                  {isCurrentUser ? "Cannot Revoke Self" : "Revoke Admin"}
                </button>
              </div>
            );
          })}
          {adminUsers.length === 0 && (
            <p className="no-data">No admin users</p>
          )}
        </div>
      </section>

      <section className="pending-users-section">
        <h3>Pending Users ({pendingUsers.length})</h3>
        <div className="user-list">
          {loading ? (
            <p className="loading">Loading pending users...</p>
          ) : sortUsersByDate(pendingUsers).map(user => (
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

      <section className="approved-users-section">
        <h3>Regular Users ({approvedUsers.length})</h3>
        <div className="user-list">
          {loading ? (
            <p className="loading">Loading approved users...</p>
          ) : sortUsersByDate(approvedUsers).map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone_number || 'Not provided'}</p>
                <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                <div className="user-status">
                  <span className="user-badge">User</span>
                </div>
              </div>
              <button
                className="admin-toggle-button grant"
                onClick={() => handleToggleAdmin(user.id)}
              >
                Make Admin
              </button>
            </div>
          ))}
          {approvedUsers.length === 0 && (
            <p className="no-data">No approved users</p>
          )}
        </div>
      </section>
    </div>
  );
};

const ContentManagement = ({ 
  albums, 
  newAlbum, 
  setNewAlbum, 
  newVideo, 
  setNewVideo, 
  handleCreateAlbum, 
  handleAddVideo 
}) => {
  return (
    <div className="content-management">
      <div className="album-form">
        <h3>Create New Album</h3>
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
        <h3>Add New Video</h3>
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
          <div className="form-group">
            <label>Video URL (YouTube or Bunny.net):</label>
            <input
              type="text"
              value={newVideo.url}
              onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
              placeholder="Enter YouTube or Bunny.net video URL"
            />
          </div>
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
    </div>
  );
};

const AdminDashboard = () => {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [newAlbum, setNewAlbum] = useState({ title: '', description: '' });
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    url: '',
    album_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    fetchAlbums();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/users/me');
      const userData = {
        ...response.data,
        id: response.data._id
      };
      setCurrentUser(userData);
    } catch (error) {
      toast.error('Failed to fetch user information');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [pendingResponse, approvedResponse, adminResponse] = await Promise.all([
        api.get('/api/admin/users/pending'),
        api.get('/api/admin/users/approved'),
        api.get('/api/admin/users/admins')
      ]);
      
      setPendingUsers(pendingResponse.data);
      setApprovedUsers(approvedResponse.data);
      setAdminUsers(adminResponse.data);
      
    } catch (error) {
      toast.error('Failed to fetch users');
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
      fetchUsers();
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

  const handleToggleAdmin = async (userId) => {
    try {
      const userToToggle = [...adminUsers, ...approvedUsers].find(u => u.id === userId);
      if (currentUser && userToToggle && userToToggle.email === currentUser.email) {
        toast.error("You cannot remove your own admin status");
        return;
      }
      await api.put(`/api/admin/users/${userId}/toggle-admin`);
      toast.success('Admin status updated successfully');
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update admin status';
      toast.error(message);
    }
  };

  const sortUsersByDate = (users) => {
    return [...users].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content Management
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' ? (
          <UserManagement 
            adminUsers={adminUsers}
            pendingUsers={pendingUsers}
            approvedUsers={approvedUsers}
            loading={loading}
            handleApproveUser={handleApproveUser}
            handleToggleAdmin={handleToggleAdmin}
            currentUser={currentUser}
            sortUsersByDate={sortUsersByDate}
          />
        ) : (
          <ContentManagement 
            albums={albums}
            newAlbum={newAlbum}
            setNewAlbum={setNewAlbum}
            newVideo={newVideo}
            setNewVideo={setNewVideo}
            handleCreateAlbum={handleCreateAlbum}
            handleAddVideo={handleAddVideo}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 