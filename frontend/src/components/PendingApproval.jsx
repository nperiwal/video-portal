import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/PendingApproval.css';

const PendingApproval = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="pending-approval">
      <div className="pending-card">
        <h2>Approval Pending</h2>
        <div className="status-icon">⏳</div>
        <p>
          Your account is currently pending admin approval. 
          You'll receive an email once your account is approved.
        </p>
        <div className="user-info">
          <p><strong>Email:</strong> {user?.email}</p>
          {user?.phone_number && (
            <p><strong>Phone:</strong> {user.phone_number}</p>
          )}
        </div>
        <div className="note">
          Please note that this process might take up to 24 hours. 
          You'll be able to access all videos once approved.
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default PendingApproval; 