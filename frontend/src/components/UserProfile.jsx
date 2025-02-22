import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/UserProfile.css';

const API_URL = "http://localhost:8000";

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/users/profile`,
        { phone_number: phoneNumber },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      
      // If user is not approved, show approval request option
      if (!user.is_approved && !approvalRequested) {
        setApprovalRequested(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/users/request-approval`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success("Approval request sent successfully");
      navigate('/pending-approval');
    } catch (error) {
      toast.error("Failed to send approval request");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Profile</h2>
          {!isEditing && (
            <button 
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="profile-info">
          <div className="info-group">
            <label>Email</label>
            <p>{user?.email}</p>
          </div>

          <div className="info-group">
            <label>Status</label>
            <p className={`status ${user?.is_approved ? 'approved' : 'pending'}`}>
              {user?.is_approved ? 'Approved' : 'Pending Approval'}
            </p>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="button-group">
                <button type="submit" className="save-button" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setPhoneNumber(user?.phone_number || '');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="info-group">
              <label>Phone Number</label>
              <p>{user?.phone_number || 'Not provided'}</p>
            </div>
          )}

          {!user?.is_approved && user?.phone_number && !approvalRequested && (
            <div className="approval-section">
              <button 
                className="request-approval-button"
                onClick={handleRequestApproval}
              >
                Request Approval
              </button>
              <p className="approval-note">
                Click to request admin approval for full access
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 