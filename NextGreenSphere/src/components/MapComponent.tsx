'use client';

import { MapContainer as LeafletMap, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  isDarkMode: boolean;
}

export default function MapComponent({ isDarkMode }: MapProps) {
  const center: [number, number] = [26.9124, 75.7873]; // Jaipur

  const hotspots = [
    { id: 1, pos: [26.9124, 75.7873] as [number, number], status: 'pending', type: 'Plastic (HDPE)', confidence: 98, inventory: 'Awaiting Pickup' },
    { id: 2, pos: [26.9200, 75.8000] as [number, number], status: 'verified', type: 'Metal (Aluminum)', confidence: 99, inventory: 'Ready for B2B Sale' },
  ];

  const getMarkerColor = (status: string) => {
    switch(status) {
      case 'pending': return '#ef4444'; // Red
      case 'verified': return '#10b981'; // Emerald
      default: return '#f59e0b'; // Amber
    }
  };

  const tileUrl = isDarkMode 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <LeafletMap 
      center={center} 
      zoom={13} 
      className="w-full h-full z-0 transition-colors duration-500"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={tileUrl} />

      {hotspots.map((h) => {
        const color = getMarkerColor(h.status);
        return (
          <div key={h.id}>
            {/* Soft Glow */}
            <CircleMarker 
              center={h.pos} 
              radius={h.status === 'pending' ? 16 : 12} 
              pathOptions={{ fillColor: color, fillOpacity: 0.2, color: 'transparent' }} 
            />
            {/* Core */}
            <CircleMarker 
              center={h.pos} 
              radius={8} 
              pathOptions={{ fillColor: color, fillOpacity: 0.9, color: 'var(--text-main)', weight: 2 }} 
            >
              <Popup className="glass-leaflet-popup" closeButton={false}>
                <div className="font-sans text-textMain">
                  <h3 className="font-bold text-sm mb-1 uppercase tracking-wide">Type: {h.type}</h3>
                  <p className="text-xs opacity-70 mb-1"><strong>AI Confidence:</strong> {h.confidence}%</p>
                  <p className="text-xs text-emerald-500 font-bold"><strong>Status:</strong> {h.inventory}</p>
                </div>
              </Popup>
            </CircleMarker>
          </div>
        );
      })}
    </LeafletMap>
  );
}
