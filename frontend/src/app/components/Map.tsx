"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationSelector({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Map({ issues, onLocationSelect, selectedLocation }: { issues?: any[], onLocationSelect?: (lat: number, lng: number) => void, selectedLocation?: { lat: number, lng: number } | null }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div style={{ height: '400px', background: '#000' }}>Loading Map...</div>;

  const zimbabweCenter: [number, number] = [-17.8252, 31.0335];

  return (
    <MapContainer 
      center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : zimbabweCenter} 
      zoom={12} 
      style={{ height: '100%', width: '100%', borderRadius: '16px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {onLocationSelect && <LocationSelector onLocationSelect={onLocationSelect} />}

      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icon}>
          <Popup><div style={{ color: '#000' }}>Selected Location</div></Popup>
        </Marker>
      )}
      {issues && issues.map((issue) => (
        issue.lat && issue.lng && (
          <Marker key={issue.id} position={[issue.lat, issue.lng]} icon={icon}>
            <Popup>
              <div style={{ color: '#000' }}>
                <strong>{issue.ref}</strong><br />
                {issue.sector}: {issue.category}
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
