import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
const geojsonData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [75.7082, 26.9855] },
      "properties": {
        "name": "Sewapura Landfill",
        "severity": 9,
        "source": "satellite",
        "type": "mixed_waste",
        "status": "critical",
        "label": "Sewapura Landfill (critical mixed_waste)",
        "color": "red"
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [75.8215, 26.8421] },
      "properties": {
        "name": "Mathuradaspura Dump Yard",
        "severity": 8,
        "source": "satellite",
        "type": "mixed_waste",
        "status": "critical",
        "label": "Mathuradaspura Dump Yard (critical mixed_waste)",
        "color": "red"
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [75.7870, 26.9150] },
      "properties": {
        "name": "Chandpole Bazaar Waste Spot",
        "severity": 6,
        "source": "user",
        "type": "plastic",
        "status": "pending",
        "label": "Chandpole Bazaar Waste Spot (pending plastic)",
        "color": "orange"
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [75.8250, 26.9000] },
      "properties": {
        "name": "Malviya Nagar Garbage Area",
        "severity": 5,
        "source": "user",
        "type": "organic",
        "status": "pending",
        "label": "Malviya Nagar Garbage Area (pending organic)",
        "color": "orange"
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [75.7700, 26.9500] },
      "properties": {
        "name": "Vaishali Nagar Dump Spot",
        "severity": 7,
        "source": "ai",
        "type": "construction_waste",
        "status": "pending",
        "label": "Vaishali Nagar Dump Spot (pending construction_waste)",
        "color": "orange"
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [75.8000, 26.8700] },
      "properties": {
        "name": "Tonk Road Waste Cluster",
        "severity": 6,
        "source": "ai",
        "type": "mixed_waste",
        "status": "pending",
        "label": "Tonk Road Waste Cluster (pending mixed_waste)",
        "color": "orange"
      }
    }
  ]
};

export default function GeoJSONLayer() {
  const map = useMap();

  useEffect(() => {
    const geoLayer = L.geoJSON(geojsonData, {
      pointToLayer: (feature, latlng) => {
        const props = feature.properties;
        const severity = props.severity || 5;
        const color = props.color || '#ff7800';
        return L.circleMarker(latlng, {
          radius: severity * 1.5,
          fillColor: color,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindPopup(`
          <b>${props.name}</b><br/>
          Type: ${props.type}<br/>
          Severity: ${props.severity}<br/>
          Status: ${props.status}<br/>
          Source: ${props.source}
        `);
      }
    }).addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(geoLayer);
    };
  }, [map]);

  return null;
}

