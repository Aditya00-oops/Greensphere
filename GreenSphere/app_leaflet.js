// GreenSphere App - Leaflet Version (Totally Free - No Token!)
// Real Data + Simulated AI, OSM + Leaflet

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

// Leaflet Map
let map, hotspotLayer, heatLayer, routeLayer;
map = L.map('map').setView([26.9124, 75.7873], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Update layers on state change
state.subscribe(() => {
  if (hotspotLayer) map.removeLayer(hotspotLayer);
  if (heatLayer) map.removeLayer(heatLayer);
  
  // Hotspots markers
  hotspotLayer = L.layerGroup();
  const uncollected = state.hotspots.filter(h => !state.collected.includes(h.id));
  uncollected.forEach(h => {
    L.circleMarker(h.coords, {
      radius: h.severity * 2,
      fillColor: h.color,
      color: 'white',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(hotspotLayer).bindPopup(h.label);
  });
  hotspotLayer.addTo(map);

  // Heatmap
  const heatPoints = state.hotspots.map(h => [h.coords[1], h.coords[0], h.severity]);
  heatLayer = L.heatLayer(heatPoints, {
    radius: 25,
    blur: 15,
    maxZoom: 17,
    max: 10,
    gradient: {0.2: 'green', 0.4: 'yellow', 0.6: 'orange', 1: 'red'}
  }).addTo(map);
});

// Load data after map
loadData();

// Map click to report
map.on('click', (e) => {
  document.getElementById('report-lat').textContent = e.latlng.lat.toFixed(4);
  document.getElementById('report-lng').textContent = e.latlng.lng.toFixed(4);
  document.getElementById('report-modal').style.display = 'block';
});

// AI Classification (simulated)
function aiClassify(lat, lng) {
  const hash = (lat * 10000 + lng * 10000) % 100;
  const types = ['plastic', 'organic', 'mixed'];
  const type = types[Math.floor(hash / 33)];
  const confidence = 0.75 + (hash % 25) / 100;
  const urgency = 4 + Math.floor(hash / 25);
  return { type, confidence: confidence.toFixed(2), urgency };
}

// Submit report
document.getElementById('submit-report').onclick = () => {
  const lat = parseFloat(document.getElementById('report-lat').textContent);
  const lng = parseFloat(document.getElementById('report-lng').textContent);
  const fileInput = document.getElementById('image-upload');
  const ai = aiClassify(lat, lng);

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
  fileInput.value = '';
};

// Buttons
document.getElementById('scan-btn').onclick = () => {
  showToast('AI Scan Complete - Heatmap Updated');
  state.notify(); // Refresh
};

document.getElementById('route-btn').onclick = () => {
  if (state.hotspots.length < 2) return showToast('Need 2+ hotspots for route');
  
  if (routeLayer) map.removeLayer(routeLayer);
  
  const path = [...state.hotspots].sort((a,b) => a.coords[0] - b.coords[0])
    .map(h => [h.coords[1], h.coords[0]]); // Leaflet [lat,lng]
  
  routeLayer = L.polyline(path, {
    color: '#6f42c1',
    weight: 6,
    opacity: 0.8
  }).addTo(map);
  
  showToast(`Route Generated: ${path.length} stops`);
};

document.getElementById('collect-btn').onclick = () => {
  const uncoll = state.hotspots.find(h => !state.collected.includes(h.id));
  if (uncoll) {
    state.toggleCollected(uncoll.id);
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
