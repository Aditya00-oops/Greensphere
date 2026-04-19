import { useState, useEffect } from 'react';
import Map from './Map.jsx';
import Sidebar from './Sidebar.jsx';
import ReportModal from './ReportModal.jsx';
import { useToast } from './useToast.js';

function App() {
  const [hotspots, setHotspots] = useState([]);
  const [credits, setCredits] = useState(0);
  const [collected, setCollected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalCoords, setModalCoords] = useState({ lat: 0, lng: 0 });
  const [routePath, setRoutePath] = useState([]);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const responseSat = await fetch('./data/satellite.json');
        const sat = await responseSat.json();
        const responseReports = await fetch('./data/sample-reports.json');
        const reports = await responseReports.json();

        setHotspots([...sat, ...reports]);
      } catch (err) {
        console.error('Data load error:', err);
      }
    }
    loadData();
  }, []);

  // localStorage sync
  useEffect(() => {
    localStorage.setItem('hotspots', JSON.stringify(hotspots));
  }, [hotspots]);

  useEffect(() => {
    const saved = localStorage.getItem('greenCredits');
    if (saved) setCredits(parseInt(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('greenCredits', credits);
    localStorage.setItem('collected', JSON.stringify(collected));
  }, [credits, collected]);

  const addHotspot = (hotspot) => {
    setHotspots(prev => [...prev, hotspot]);
    setCredits(c => c + 10);
    toast('AI Classified & +10 Green Credits!');
  };

  const toggleCollected = (id) => {
    setCollected(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleMapClick = (lat, lng) => {
    // Auto AI classify on click
    const hash = (lat * 10000 + lng * 10000) % 100;
    const types = ['plastic', 'organic', 'mixed'];
    const type = types[Math.floor(hash / 33)];
    const confidence = (0.75 + (hash % 25) / 100).toFixed(2);
    const urgency = 4 + Math.floor(hash / 25);
    
    const hotspot = {
      id: Date.now(),
      coords: [lng, lat],
      type,
      severity: urgency,
      source: 'auto-user',
      label: `Auto Report (${type}, conf: ${confidence})`,
      color: 'orange'
    };
    
    addHotspot(hotspot);
  };

  const onScan = () => {
    const center = mapCenter || [26.9124, 75.7873];
    handleMapClick(center[1], center[0]);
    toast('Auto AI Scan Complete!');
  };

  const generateRoute = () => {
    if (hotspots.length < 2) {
      toast('Need 2+ hotspots for route');
      return;
    }
    const path = [...hotspots]
      .sort((a, b) => a.coords[0] - b.coords[0])
      .map(h => [h.coords[1], h.coords[0]]);
    setRoutePath(path);
    toast(`Route Generated: ${path.length} stops`);
  };

  const analytics = {
    total: hotspots.length,
    collected: collected.length,
    co2Saved: (hotspots.length * 0.5 - collected.length * 0.3).toFixed(1),
    efficiency: hotspots.length > 0 ? ((collected.length / hotspots.length) * 100).toFixed(1) : 0
  };

  return (
    <>
      <div id="topbar">
        <div className="logo">🌱 GreenSphere React</div>
        <div id="credits">Green Credits: {credits}</div>
      </div>
      
      <div className="container">
        <Map 
          hotspots={hotspots.filter(h => !collected.includes(h.id))} 
          routePath={routePath}
          onMapClick={handleMapClick}
        />
        <Sidebar 
          analytics={analytics}
          onScan={onScan}
          onRoute={generateRoute}
          onCollect={() => {
            const uncoll = hotspots.find(h => !collected.includes(h.id));
            if (uncoll) {
              toggleCollected(uncoll.id);
              toast('Marked as Collected ✅');
            }
          }}
        />
      </div>
      
      {showModal && (
        <ReportModal 
          coords={modalCoords}
          onClose={() => setShowModal(false)}
          onSubmit={addHotspot}
        />
      )}
    </>
  );
}

export default App;

