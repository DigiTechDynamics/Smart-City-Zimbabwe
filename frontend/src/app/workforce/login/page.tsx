"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workforceLogin } from '../../lib/api';

export default function WorkforceLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await workforceLogin(email, password);
      localStorage.setItem('workforceUser', JSON.stringify(data.user));
      router.push('/workforce');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle at top right,#1a1a2e,#0a0c10)' }}>
      <div className="glass-card animate-fade" style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'12px' }}>👷</div>
          <h1 style={{ fontSize:'1.8rem', marginBottom:'8px' }}>Workforce Portal</h1>
          <p style={{ color:'var(--text-secondary)' }}>Smart Zimbabwe City Services</p>
        </div>
        {error && (
          <div style={{ background:'rgba(255,75,43,0.15)', border:'1px solid rgba(255,75,43,0.4)', borderRadius:'8px', padding:'12px', marginBottom:'20px', color:'#ff4b2b', fontSize:'0.9rem' }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ fontSize:'0.85rem', color:'var(--text-secondary)', display:'block', marginBottom:'6px' }}>Work Email</label>
            <input type="email" placeholder="yourname@smartcity.gov.zw" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom:'28px' }}>
            <label style={{ fontSize:'0.85rem', color:'var(--text-secondary)', display:'block', marginBottom:'6px' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width:'100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop:'24px', textAlign:'center', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
          🔒 Workforce members only · <a href="/smartcityzim/login" style={{ color:'var(--accent-electricity)', textDecoration:'none' }}>Admin Login →</a>
        </div>
      </div>
    </main>
  );
}
