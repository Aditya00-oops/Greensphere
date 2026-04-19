'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayerGroup, Polyline, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapContainerProps {
  ghostMode?: boolean;
  isDarkMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function HotspotMarkers({ hotspots }: { hotspots: any[] }) {
  return (
    <LayerGroup>
      {hotspots.map((h) => (
        <CircleMarker
          key={h.id}
          center={[h.coords[1], h.coords[0]]} // Swapped for Leaflet [Lat, Lng]
          radius={h.severity * 2}
          fillColor={h.color}
          color="white"
          weight={2}
          opacity={1}
          fillOpacity={0.8}
        >
          <Popup>
            <div className="p-1">
              <h4 className="font-bold text-sm uppercase">{h.label}</h4>
              <p className="text-[10px] opacity-70">Coordinates: {h.coords[1]}, {h.coords[0]}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </LayerGroup>
  );
}

import { useGlobal } from "@/context/GlobalContext";

export default function LeafletMapContainer({ ghostMode = false, isDarkMode = false, onMapClick }: LeafletMapContainerProps) {
  const { hotspots: globalHotspots } = useGlobal();
  const [backendHotspots, setBackendHotspots] = useState<any[]>([]);

  useEffect(() => {
    // Load static hotspots from backend
    fetch("http://localhost:8000/api/hotspots")
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const mapped = data.features.map((f: any) => ({
            id: f.properties.id,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            label: f.properties.waste_type,
            severity: f.properties.confidence / 10,
            color: f.properties.status === 'verified' ? '#10b981' : '#ef4444'
          }));
          setBackendHotspots(mapped);
        }
      })
      .catch(err => console.error("Map fetch error:", err));
  }, []);

  // Combine global (real-time) hotspots and backend (static) hotspots
  const allHotspots = [
    ...backendHotspots,
    ...globalHotspots.map(h => ({
      id: h.id,
      lat: h.lat,
      lng: h.lng,
      label: h.type,
      severity: h.severity,
      color: h.status === 'collected' ? '#6b7280' : (h.source === 'satellite' ? '#10b981' : '#f59e0b')
    }))
  ];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[26.9124, 75.7873]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: isDarkMode ? '#111827' : '#f3f4f6' }}
      >
        <TileLayer
          url={isDarkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents onMapClick={onMapClick} />
        
        <LayerGroup>
          {allHotspots.map((h) => (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={h.severity * 2}
              fillColor={h.color}
              color="white"
              weight={2}
              opacity={1}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-sm uppercase">{h.label}</h4>
                  <p className="text-[10px] opacity-70">Source: {h.id.toString().includes('user') ? 'User Report' : 'Satellite'}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}

