'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function MapContainer({ ghostMode = false, isDarkMode = false }: { ghostMode?: boolean, isDarkMode?: boolean }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return; 
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [75.7873, 26.9124], 
      zoom: 12.5,
      pitch: 45, 
    });

    map.current.on('load', () => {
      fetchHotspots();
      
      map.current?.addSource('ghost-sector', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[75.77, 26.90], [75.80, 26.90], [75.80, 26.93], [75.77, 26.93], [75.77, 26.90]]]
          },
          properties: {}
        }
      });

      map.current?.addLayer({
        id: 'ghost-sector-layer', type: 'fill', source: 'ghost-sector',
        paint: { 'fill-color': '#475569', 'fill-opacity': 0 }
      });
    });
  }, []);

  useEffect(() => {
    if (map.current) {
      map.current.setStyle(isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
      map.current.once('style.load', () => {
        fetchHotspots();
        if (!map.current!.getSource('ghost-sector')) {
          map.current!.addSource('ghost-sector', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[75.77, 26.90], [75.80, 26.90], [75.80, 26.93], [75.77, 26.93], [75.77, 26.90]]] }, properties: {} }
          });
          map.current!.addLayer({
            id: 'ghost-sector-layer', type: 'fill', source: 'ghost-sector', paint: { 'fill-color': '#475569', 'fill-opacity': ghostMode ? 0.4 : 0 }
          });
        }
      });
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && map.current.getLayer('ghost-sector-layer')) {
      map.current.setPaintProperty('ghost-sector-layer', 'fill-opacity', ghostMode ? 0.4 : 0);
      
      if (ghostMode && map.current.getLayer('hotspot-circles')) {
        map.current.setPaintProperty('hotspot-circles', 'circle-color', '#94a3b8');
      } else if (map.current.getLayer('hotspot-circles')) {
        map.current.setPaintProperty('hotspot-circles', 'circle-color', [
          'match', ['get', 'status'], 'pending', '#ef4444', 'en_route', '#f59e0b', 'verified', '#10b981', '#9ca3af'
        ]);
      }
    }
  }, [ghostMode]);

  const fetchHotspots = async () => {
    const data = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [75.7873, 26.9124] }, properties: { id: 1, severity: 8, status: 'pending', waste_type: 'Plastic (HDPE)', confidence: 98, inventory: 'Awaiting Pickup' }},
        { type: "Feature", geometry: { type: "Point", coordinates: [75.8000, 26.9200] }, properties: { id: 2, severity: 5, status: 'verified', waste_type: 'Metal (Aluminum)', confidence: 99, inventory: 'Ready for B2B Sale' }},
        { type: "Feature", geometry: { type: "Point", coordinates: [75.7950, 26.9050] }, properties: { id: 3, severity: 7, status: 'en_route', waste_type: 'Organic', confidence: 92, inventory: 'Truck Dispatched' }}
      ]
    };

    if (map.current && !map.current.getSource('hotspots')) {
      map.current.addSource('hotspots', { type: 'geojson', data: data as any });
      map.current.addLayer({
        id: 'hotspot-circles', type: 'circle', source: 'hotspots',
        paint: {
          'circle-radius': 12,
          'circle-color': ['match', ['get', 'status'], 'pending', '#ef4444', 'en_route', '#f59e0b', 'verified', '#10b981', '#9ca3af'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 3,
          'circle-stroke-color': isDarkMode ? '#1e293b' : '#ffffff'
        }
      });

      map.current.on('click', 'hotspot-circles', (e) => {
        if (!e.features || e.features.length === 0) return;
        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const props = e.features[0].properties;

        const description = `
          <div class="p-2 font-sans text-textPrimary">
            <h3 class="font-bold text-sm mb-1 uppercase tracking-wide">Type: ${props.waste_type}</h3>
            <p class="text-xs text-textSecondary mb-1"><strong>AI Confidence:</strong> ${props.confidence || 95}%</p>
            <p class="text-xs text-accent font-bold"><strong>Status:</strong> ${props.inventory || props.status}</p>
          </div>
        `;

        new mapboxgl.Popup({ closeButton: false, offset: 15 })
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map.current!);
      });

      map.current.on('mouseenter', 'hotspot-circles', () => { map.current!.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', 'hotspot-circles', () => { map.current!.getCanvas().style.cursor = ''; });
    }
  };

  return <div ref={mapContainer} className="w-full h-full absolute inset-0 z-0" />;
}
