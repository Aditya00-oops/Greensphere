// GreenSphere App - Real Data + Simulated AI
// Mapbox token: Get free from account.mapbox.com, replace below

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWRpdHlha3VtYXJnYXJ3YWwiLCJhIjoiY2x0cXh4bGJ4MDJ1cjJrcW1yNnF2M3J3dyJ9.YOUR_FREE_TOKEN_HERE'; // Free tier sufficient for demo

if (MAPBOX_TOKEN === 'pk.eyJ1IjoiYWRpdHlha3VtYXJnYXJ3YWwiLCJhIjoiY2x0cXh4bGJ4MDJ1cjJrcW1yNnF2M3J3dyJ9.YOUR_FREE_TOKEN_HERE') {
  alert('Please set your Mapbox token in app.js!');
}

// State Management (Hook sim)
class State {
  constructor() {
    this.hotspots = [];
    this.credits = parseInt(localStorage.getItem('greenCredits') || '0');
    this.collected = JSON.parse(localStorage.getItem('collected') || '[]');
    this.listeners = [];
  }

  setHotspots(h) {
    this.hotspots = h;
    this.notify();
    this.updateAnalytics();
  }

  addHotspot(h) {
    this.hotspots.push(h);
    localStorage.setItem('hotspots', JSON.stringify(this.hotspots));
    this.notify();
    this.updateAnalytics();
  }

  addCredits(amount) {
    this.credits += amount;
    localStorage.setItem('greenCredits', this.credits);
    document.getElementById('credits').textContent = `Green Credits: ${this.credits}`;
    this.notify();
  }

  toggleCollected(id) {
    const idx = this.collected.indexOf(id);
    if (idx > -1) {
      this.collected.splice(idx, 1);
    } else {
      this.collected.push(id);
    }
    localStorage.setItem('collected', JSON.stringify(this.collected));
    this.notify();
    this.updateAnalytics();
  }

  notify() {
    this.listeners.forEach(cb => cb());
  }

  subscribe(cb) {
    this.listeners.push(cb);
  }
}

const state = new State();

// Load mock data
async function loadData() {
  const sat = await fetch('data/satellite.json').then(r => r.json());
  const user = await fetch('data/sample-reports.json').then(r => r.json());
  state.setHotspots([...sat, ...user]);
}

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [75.7873, 26.9124],
  zoom: 11,
  accessToken: MAPBOX_TOKEN
});

map.on('load', () => {
  // Hotspots GeoJSON source/layer (markers)
  map.addSource('hotspots', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addLayer({
    id: 'hotspots-markers',
    type: 'circle',
    source: 'hotspots',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'severity'], 3, 8, 10, 20
      ],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': 'white',
      'circle-stroke-width': 2
    }
  });

  map.addLayer({
    id: 'hotspots-labels',
    type: 'symbol',
    source: 'hotspots',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 12,
      'text-offset': [0, 2]
    },
    paint: {
      'text-color': 'white',
      'text-halo-color': 'black',
      'text-halo-width': 1
    }
  });

  // Heatmap layer
  map.addSource('heatmap-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addLayer({
    id: 'heatmap',
    type: 'heatmap',
    source: 'heatmap-source',
    paint: {
      'heatmap-weight': [
        'interpolate', ['linear'], ['get', 'severity'], 0, 0, 10, 1
      ],
      'heatmap-intensity': 1,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, '#00ff00',
        0.4, '#ffff00',
        0.6, '#ffaa00',
        1, '#ff0000'
      ],
      'heatmap-radius': 20,
      'heatmap-opacity': 0.6
    }
  });

  // Route layer
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} }
  });

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#6f42c1',
      'line-width': 6,
      'line-opacity': 0.8
    }
  });

  // Update on state change
  state.subscribe(() => {
    const features = state.hotspots.map(h => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: h.coords },
      properties: h
    })).filter(h => !state.collected.includes(h.properties.id));

    map.getSource('hotspots').setData({
      type: 'FeatureCollection',
      features
    });

    map.getSource('heatmap-source').setData({
      type: 'FeatureCollection',
      features: state.hotspots.map(h => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: h.coords },
        properties: { severity: h.severity }
      }))
    });
  });

  loadData();
});

// Map click to report
map.on('click', (e) => {
  document.getElementById('report-lat').textContent = e.lngLat.lat.toFixed(4);
  document.getElementById('report-lng').textContent = e.lngLat.lng.toFixed(4);
  document.getElementById('report-modal').style.display = 'block';
});

// AI Classification (Connected to Real Backend)
async function aiClassify(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const res = await fetch('http://localhost:8000/api/detect', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    
    return {
      type: data.garbage_type || 'mixed',
      confidence: data.confidence.toFixed(2),
      urgency: data.is_garbage ? 8 : 2
    };
  } catch (e) {
    console.error('AI error', e);
    return { type: 'unknown', confidence: '0.00', urgency: 1 };
  }
}

// Submit report
document.getElementById('submit-report').onclick = async () => {
  const lat = parseFloat(document.getElementById('report-lat').textContent);
  const lng = parseFloat(document.getElementById('report-lng').textContent);
  const fileInput = document.getElementById('image-upload');
  const file = fileInput.files[0];
  
  if (!file) {
    showToast('Please select an image first.');
    return;
  }
  
  showToast('AI analyzing image...');
  const ai = await aiClassify(file);

  const hotspot = {
    id: Date.now(),
    coords: [lng, lat],
    type: ai.type,
    severity: ai.urgency,
    source: 'user',
    label: `User Report (${ai.type}, conf: ${ai.confidence})`,
    color: 'orange'
  };

  state.addHotspot(hotspot);
  state.addCredits(10);
  showToast(`+10 Green Credits! AI: ${ai.type} (${ai.confidence} conf)`);
  document.getElementById('report-modal').style.display = 'none';
  fileInput.value = ''; // Reset
};

// Buttons
document.getElementById('scan-btn').onclick = () => {
  showToast('AI Scan Complete - Heatmap Updated');
};

document.getElementById('route-btn').onclick = () => {
  if (state.hotspots.length < 2) return showToast('Need 2+ hotspots for route');
  
  // Simple nearest neighbor sim: sort by lng
  const path = [...state.hotspots].sort((a,b) => a.coords[0] - b.coords[0])
    .map(h => h.coords);
  
  map.getSource('route').setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: path },
    properties: { distance: path.length * 2 } // mock km
  });
  showToast(`Route Generated: ${path.length} stops`);
};

document.getElementById('collect-btn').onclick = () => {
  const recent = state.hotspots[state.hotspots.length - 1];
  if (recent) {
    state.toggleCollected(recent.id);
    showToast('Marked as Collected ✅');
  }
};

// Modal close
document.querySelector('.close').onclick = () => {
  document.getElementById('report-modal').style.display = 'none';
};

window.onclick = (e) => {
  const modal = document.getElementById('report-modal');
  if (e.target === modal) modal.style.display = 'none';
};

// Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Analytics update
function updateAnalytics() {
  const total = state.hotspots.length;
  const coll = state.collected.length;
  document.getElementById('total-hotspots').textContent = total;
  document.getElementById('collected').textContent = coll;
  document.getElementById('co2-saved').textContent = (total * 0.5 - coll * 0.3).toFixed(1);
  document.getElementById('efficiency').textContent = total > 0 ? ((coll / total) * 100).toFixed(1) : 0;
}

// Init analytics
updateAnalytics();

// Collected toggle sim (for demo)
document.getElementById('collect-btn').onclick = () => {
  // Toggle first uncollected
  const uncoll = state.hotspots.find(h => !state.collected.includes(h.id));
  if (uncoll) state.toggleCollected(uncoll.id);
};

