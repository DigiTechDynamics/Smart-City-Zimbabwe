"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchIssues } from './lib/api';

const DynamicMap = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map Engine...</div>
});

export default function Home() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchIssues();
        setIssues(data.map((i: any) => ({
          id: i.id,
          ref: i.reference_number,
          sector: i.sector.replace('_', ' ').toUpperCase(),
          category: i.category,
          status: i.status,
          priority: i.priority,
          lat: i.latitude || (-17.82 + (Math.random() * 0.1)), // Mock coords if missing
          lng: i.longitude || (31.03 + (Math.random() * 0.1))
        })));
      } catch (error) {
        console.error("Failed to load issues", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main>
      <header className="header">
        <h1>Smart Zimbabwe</h1>
        <p>Unified Service Management Platform</p>
      </header>

      <div style={{ padding: '0 40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link href="/report">
          <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '15px 40px' }}>
            Report a New Issue
          </button>
        </Link>
        <Link href="/track">
          <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '15px 40px', background: 'transparent', border: '1px solid var(--accent-electricity)', color: 'var(--text-primary)' }}>
            Track Existing Issue
          </button>
        </Link>
      </div>

      <div className="grid-container">
        {/* Sector Overviews */}
        <div className="glass-card">
          <h2 style={{ color: 'var(--accent-electricity)', marginBottom: '10px' }}>Electricity</h2>
          <p style={{ color: 'var(--text-secondary)' }}>ZETDC Management System</p>
          <div style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 'bold' }}>12 Active</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reports this week</div>
        </div>

        <div className="glass-card">
          <h2 style={{ color: 'var(--accent-water)', marginBottom: '10px' }}>Water & Sewer</h2>
          <p style={{ color: 'var(--text-secondary)' }}>City Council Services</p>
          <div style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 'bold' }}>28 Active</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reports this week</div>
        </div>

        <div className="glass-card">
          <h2 style={{ color: 'var(--accent-roads)', marginBottom: '10px' }}>Roads & Infra</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ministry of Transport</p>
          <div style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 'bold' }}>8 Active</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reports this week</div>
        </div>

        <div className="glass-card">
          <h2 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>Waste Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Environmental Services</p>
          <div style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 'bold' }}>15 Active</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reports this week</div>
        </div>

        <div className="glass-card">
          <h2 style={{ color: 'var(--accent-urgent)', marginBottom: '10px' }}>Emergency Services</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Fire & Rescue</p>
          <div style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 'bold' }}>3 Active</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reports this week</div>
        </div>

        <div className="glass-card">
          <h2 style={{ color: 'var(--accent-yellow)', marginBottom: '10px' }}>Public Health</h2>
          <p style={{ color: 'var(--text-secondary)' }}>City Health Department</p>
          <div style={{ marginTop: '20px', fontSize: '2rem', fontWeight: 'bold' }}>7 Active</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reports this week</div>
        </div>
      </div>

      <section style={{ padding: '40px' }}>
        <h2 style={{ marginBottom: '24px' }}>Recent Public Reports</h2>
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
              <tr>
                <th style={{ padding: '15px' }}>Ref Number</th>
                <th style={{ padding: '15px' }}>Sector</th>
                <th style={{ padding: '15px' }}>Category</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue: any) => (
                <tr key={issue.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '15px' }}>{issue.ref}</td>
                  <td style={{ padding: '15px' }}>{issue.sector}</td>
                  <td style={{ padding: '15px' }}>{issue.category}</td>
                  <td style={{ padding: '15px' }}>
                    <span className={`status-badge status-${issue.status.toLowerCase().replace(' ', '-')}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: issue.priority === 'Critical' ? 'var(--accent-urgent)' : 'inherit' }}>
                    {issue.priority}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Map Implementation */}
      <section style={{ padding: '40px' }}>
        <h2 style={{ marginBottom: '24px' }}>Live Issue Map</h2>
        <div className="glass-card" style={{ height: '500px', padding: '10px' }}>
          <DynamicMap issues={issues} />
        </div>
      </section>
    </main>
  );
}
