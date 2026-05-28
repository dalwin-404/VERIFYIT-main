'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim() || !username.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password })
      });

      const data = await response.json();

      if (response.ok) {
        authRegister(data.access_token, data.user);
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setError(data.detail || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: 0, display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem 0' }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '450px', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', margin: '0 auto' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="auth-logo" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
            <i className="fas fa-check"></i>
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.5rem 0' }}>
            Verify<span className="brand-accent" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>It</span>
          </h1>
          <p className="auth-subtitle" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Create your account</p>
        </div>

        {success && (
          <div className="success-message show" style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
            Account created successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="error-message show" style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
            <input
              type="email"
              className="form-input"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', border: '2px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>Username</label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', border: '2px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              className="form-input"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', border: '2px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>Confirm Password</label>
            <input
              type="password"
              className="form-input"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', border: '2px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
