import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import { auth } from '../firebase'; // Add this import

export default function Header({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/signin');
  };

  return (
    <nav className="navbar navbar-expand-lg" role="navigation" style={{position: 'sticky', top: 0, zIndex: 1020}}>
      <div className="container d-flex justify-content-between align-items-center">
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{gap: '10px'}}>
          <img
            src="https://thumbs.dreamstime.com/b/eagle-head-simple-logo-design-template-359138889.jpg"
            alt="Logo"
            style={{ height: '38px', width: '38px', objectFit: 'cover', borderRadius: '50%', marginRight: '8px' }}
          />
          Nina Store
        </Link>
        <div className="d-flex align-items-center">
          <ul className="navbar-nav flex-row align-items-center me-3">
            <li className="nav-item mx-2">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item mx-2">
              <Link className="nav-link" to="/about">About</Link>
            </li>
            <li className="nav-item mx-2">
              <Link className="nav-link" to="/products">Products</Link>
            </li>
            <li className="nav-item mx-2">
              <Link className="nav-link" to="/cart">Cart</Link>
            </li>
            {user && (
              <></>
            )}
          </ul>
          <div className="d-flex align-items-center">
            {user ? (
              <AccountMenu user={user} onSignOut={handleSignOut} />
            ) : (
              <Link className="btn btn-outline-primary ms-2" to="/signin">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const avatar = (user && (user.photoURL || user.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'));

  return (
    <div className="account-menu" ref={ref}>
      <img
        src={avatar}
        alt="Account"
        className="account-avatar"
        onClick={() => setOpen((v) => !v)}
      />
      <div className={`account-dropdown ${open ? 'show' : ''}`} role="menu">
        <Link to="/account" className="account-item" onClick={() => setOpen(false)}>Account</Link>
        <Link to="/history" className="account-item" onClick={() => setOpen(false)}>History</Link>
        <button className="account-item signout" onClick={() => { setOpen(false); onSignOut(); }}>Sign Out</button>
      </div>
    </div>
  );
}

