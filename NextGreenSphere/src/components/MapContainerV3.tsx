'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function MapContainerV3({ isDarkMode }: { isDarkMode: boolean }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return; 
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [75.7873, 26.9124], 
      zoom: 13,
      pitch: 45, 
    });

    map.current.on('load', () => {
      fetchHotspots();
    });
  }, []);

  // Update style when theme changes
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
      // Re-add sources after style load
      map.current.once('style.load', () => {
        fetchHotspots();
      });
    }
  }, [isDarkMode]);

  const fetchHotspots = async () => {
    let data;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/hotspots`);
      if (!res.ok) throw new Error("Backend not running");
      data = await res.json();
    } catch (err) {
      // Mock Data
      data = {
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: [75.7873, 26.9124] }, properties: { id: 1, status: 'pending', waste_type: 'Plastic (HDPE)', confidence: 98, inventory: 'Awaiting Pickup' }},
          { type: "Feature", geometry: { type: "Point", coordinates: [75.8000, 26.9200] }, properties: { id: 2, status: 'verified', waste_type: 'Metal (Aluminum)', confidence: 99, inventory: 'Ready for B2B Sale' }},
        ]
      };
    }

    if (map.current && !map.current.getSource('hotspots')) {
      map.current.addSource('hotspots', { type: 'geojson', data });

      map.current.addLayer({
        id: 'hotspot-circles',
        type: 'circle',
        source: 'hotspots',
        paint: {
          'circle-radius': 14,
          'circle-color': [
            'match',
            ['get', 'status'],
            'pending', '#ef4444',     
            'verified', '#10b981',    
            '#f59e0b'
          ],
          'circle-opacity': 0.9,
          'circle-stroke-width': 3,
          'circle-stroke-color': isDarkMode ? '#1e293b' : '#ffffff'
        }
      });

      // Tooltip
      map.current.on('click', 'hotspot-circles', (e) => {
        if (!e.features || e.features.length === 0) return;
        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const props = e.features[0].properties;

        const description = `
          <div class="p-2 font-sans">
            <h3 class="font-bold text-sm mb-1 uppercase tracking-wide">Type: ${props.waste_type}</h3>
            <p class="text-xs mb-1 opacity-80"><strong>AI Confidence:</strong> ${props.confidence}%</p>
            <p class="text-xs text-emerald-500 font-bold"><strong>Status:</strong> ${props.inventory}</p>
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
