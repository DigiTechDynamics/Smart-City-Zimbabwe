"use client";

import React, { useState } from 'react';
import Link from 'next/link';

import { getIssueByRef } from '../lib/api';

export default function TrackIssue() {
  const [refNumber, setRefNumber] = useState('');
  const [issueDetails, setIssueDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIssueDetails(null);
    
    try {
      const data = await getIssueByRef(refNumber);
      // Map backend fields to frontend view
      setIssueDetails({
        ref: data.reference_number,
        sector: data.sector.replace('_', ' ').toUpperCase(),
        category: data.category,
        status: data.status,
        assignedTo: data.assigned_to_id ? 'Engineer Assigned' : 'Awaiting Assignment',
        reportedAt: new Date(data.created_at).toLocaleString(),
        history: [
          { time: new Date(data.created_at).toLocaleString(), status: 'Reported', message: 'Issue received by system.' },
        ]
      });
    } catch (error) {
      alert("Issue not found or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <div className="glass-card">
        <h1 style={{ marginBottom: '24px' }}>Track Your Report</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Enter your reference number to check the live status of your reported issue.
        </p>

        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="e.g. REF-A1B2C3D4" 
            required
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={loading}>
            {loading ? 'Searching...' : 'Track Issue'}
          </button>
        </form>

        {issueDetails && (
          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Status: <span className="status-badge status-assigned">{issueDetails.status}</span></h2>
              <span style={{ color: 'var(--text-secondary)' }}>Ref: {issueDetails.ref}</span>
            </div>

            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sector</label>
                  <p>{issueDetails.sector}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                  <p>{issueDetails.category}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned To</label>
                  <p>{issueDetails.assignedTo}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reported At</label>
                  <p>{issueDetails.reportedAt}</p>
                </div>
              </div>
            </div>

            <h3>Timeline</h3>
            <div style={{ marginTop: '20px' }}>
              {issueDetails.history.map((step, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  marginBottom: '20px',
                  borderLeft: '2px solid var(--accent-electricity)',
                  paddingLeft: '20px',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-electricity)',
                    position: 'absolute',
                    left: '-7px',
                    top: '5px'
                  }}></div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.time}</div>
                    <div style={{ fontWeight: '600' }}>{step.status}</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{step.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--accent-electricity)', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
