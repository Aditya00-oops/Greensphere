import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function GEEGeoJSONLayer() {
  const map = useMap();
  const layerRef = useRef();

  useEffect(() => {
    fetch('http://localhost:8000/satellite')
      .then(res => res.json())
      .then(geeData => {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        layerRef.current = L.geoJSON(geeData, {
          pointToLayer: (feature, latlng) => {
            const severity = feature.properties.severity || 8;
            return L.circleMarker(latlng, {
              radius: severity,
              fillColor: 'purple',
              color: 'white',
              weight: 3,
              fillOpacity: 0.7
            });
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <b>GEE Satellite Waste Detection</b><br>
              Type: ${feature.properties.type || 'anomaly'}<br>
              Severity: ${feature.properties.severity}<br>
              Source: Google Earth Engine
            `);
          }
        }).addTo(map);
      })
      .catch(err => console.log('GEE API error (use demo):', err));

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map]);

  return null;
}

