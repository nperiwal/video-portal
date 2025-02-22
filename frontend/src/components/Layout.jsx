import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="layout">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">
              <img src="/video-icon.svg" alt="Video Portal" className="nav-logo" />
              <span>Video Portal</span>
            </Link>
          </div>
          
          <div className="nav-links">
            {user ? (
              <>
                <Link to="/browse">Browse Videos</Link>
                {user.is_admin && (
                  <Link to="/admin" className="admin-link">Admin Dashboard</Link>
                )}
                <Link to="/profile">Profile</Link>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
              </>
            )}
          </div>
        </nav>

        <main className="main-content">
          {children}
        </main>

        <footer className="footer">
          <p>&copy; 2024 Video Portal. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout; 