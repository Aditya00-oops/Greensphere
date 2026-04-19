import { MapContainer, TileLayer, LayerGroup, CircleMarker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import GeoJSONLayer from './GeoJSONLayer.jsx';
import GEEGeoJSONLayer from './GEEGeoJSONLayer.jsx';

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function HotspotMarkers({ hotspots }) {
  return (
    <LayerGroup>
      {hotspots.map(h => (
        <CircleMarker
          key={h.id}
          center={[h.coords[1], h.coords[0]]}
          radius={h.severity * 2}
          fillColor={h.color}
          color="white"
          weight={2}
          opacity={1}
          fillOpacity={0.8}
        >
          <L.Popup>{h.label}</L.Popup>
        </CircleMarker>
      ))}
    </LayerGroup>
  );
}

function HeatLayer({ hotspots }) {
  const map = useMap();
  const heatRef = useRef();

  useEffect(() => {
    if (map && hotspots.length > 0) {
      const heatPoints = hotspots.map(h => [h.coords[1], h.coords[0], h.severity]);
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
      }
      heatRef.current = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 10,
        gradient: {0.2: 'green', 0.4: 'yellow', 0.6: 'orange', 1: 'red'}
      }).addTo(map);
    }
  }, [map, hotspots]);

  return null;
}

function RouteLayer({ routePath }) {
  if (routePath.length < 2) return null;
  return (
    <Polyline 
      positions={routePath}
      color="#6f42c1"
      weight={6}
      opacity={0.8}
    />
  );
}

export default function Map({ hotspots, routePath, onMapClick }) {
  return (
    <MapContainer 
      center={[26.9124, 75.7873]} 
      zoom={11} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapEvents onMapClick={onMapClick} />
      <GeoJSONLayer />
      <GEEGeoJSONLayer />
      <HotspotMarkers hotspots={hotspots} />
      <HeatLayer hotspots={hotspots} />
      <RouteLayer routePath={routePath} />

    </MapContainer>
  );
}

