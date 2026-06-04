import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

export default function SignOut({ setUser }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Signing out...');

  useEffect(() => {
    const doSignOut = async () => {
      try {
        await auth.signOut();
        setUser?.(null);
        setStatus('You have been signed out successfully. Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 1200);
      } catch (err) {
        setStatus('Unable to sign out. Please try again.');
      }
    };
    doSignOut();
  }, [navigate, setUser]);

  return (
    <div className="container my-5">
      <div className="card p-5 mx-auto text-center" style={{ maxWidth: 560, border: '1px solid rgba(249, 115, 22, 0.22)' }}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="Sign Out"
          style={{ width: 96, height: 96, marginBottom: 24 }}
        />
        <h2 style={{ color: '#f97316', marginBottom: 12 }}>Signing Out</h2>
        <p style={{ color: '#4b5563', marginBottom: 0 }}>{status}</p>
      </div>
    </div>
  );
}
