"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { createIssue, fetchCategories } from '../lib/api';

const DynamicMap = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>Loading Map Engine...</div>
});

export default function ReportIssue() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    sector: 'electricity',
    category: '',
    description: '',
    address: '',
    priority: 'medium',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories(formData.sector);
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        } else {
          setFormData(prev => ({ ...prev, category: '' }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, [formData.sector]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await createIssue(formData);
      setSubmittedRef(result.reference_number);
    } catch (error) {
      alert("Failed to report issue. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRef) {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
          <h1 style={{ marginBottom: '16px', color: '#4caf50' }}>Report Submitted Successfully!</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Thank you for helping keep Smart Zimbabwe running smoothly.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '40px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Ticket Reference</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-electricity)', letterSpacing: '2px', marginTop: '8px' }}>
              {submittedRef}
            </div>
          </div>
          <p style={{ marginBottom: '30px' }}>
            You will receive updates as our workforce resolves the issue.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
            Return to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <button 
        onClick={() => router.back()} 
        style={{ marginBottom: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        ← Back
      </button>
      <div className="glass-card">
        <h1 style={{ marginBottom: '24px' }}>Report Public Service Fault</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>Service Sector</label>
            <select 
              value={formData.sector} 
              onChange={(e) => setFormData({...formData, sector: e.target.value})}
            >
              <option value="electricity">Electricity (ZETDC)</option>
              <option value="water_sewer">Water & Sewer (City Council)</option>
              <option value="roads_infra">Roads & Infrastructure</option>
              <option value="waste_management">Waste Management</option>
              <option value="emergency_services">Emergency Services</option>
              <option value="public_health">Public Health</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Category</label>
            {categories.length > 0 ? (
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                placeholder="e.g. Power Outage, Pipe Burst, Pothole" 
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Description</label>
            <textarea 
              rows={4} 
              placeholder="Provide details about the issue..." 
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Location / Address</label>
            <input 
              type="text" 
              placeholder="Enter address or pinpoint on map" 
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            <div style={{ marginTop: '10px', height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
               <DynamicMap 
                 selectedLocation={formData.latitude ? { lat: formData.latitude, lng: formData.longitude! } : null}
                 onLocationSelect={(lat, lng) => {
                   setFormData({...formData, latitude: lat, longitude: lng});
                   if (!formData.address || formData.address.match(/^-?\d+\.\d+, -?\d+\.\d+$/)) {
                      setFormData(prev => ({...prev, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`}));
                   }
                 }}
               />
            </div>
            {formData.latitude && <div style={{ fontSize: '0.8rem', color: '#4caf50', marginTop: '8px' }}>✓ Location pinpointed on map</div>}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '20px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </main>
  );
}
