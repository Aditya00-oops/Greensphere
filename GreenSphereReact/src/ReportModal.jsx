import { useState } from 'react';

export default function ReportModal({ coords, onClose, onSubmit }) {
  const [file, setFile] = useState(null);

  const aiClassify = (lat, lng) => {
    const hash = (lat * 10000 + lng * 10000) % 100;
    const types = ['plastic', 'organic', 'mixed'];
    const type = types[Math.floor(hash / 33)];
    const confidence = (0.75 + (hash % 25) / 100).toFixed(2);
    const urgency = 4 + Math.floor(hash / 25);
    return { type, confidence, urgency };
  };

  const handleSubmit = () => {
    const ai = aiClassify(coords.lat, coords.lng);
    const hotspot = {
      id: Date.now(),
      coords: [coords.lng, coords.lat],
      type: ai.type,
      severity: ai.urgency,
      source: 'user',
      label: `User Report (${ai.type}, conf: ${ai.confidence})`,
      color: 'orange'
    };
    onSubmit(hotspot);
    onClose();
    setFile(null);
  };

  return (
    <div id="report-modal" className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Report Garbage</h3>
        <p>Location: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
        <input 
          type="file" 
          id="image-upload" 
          accept="image/*" 
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button id="submit-report" onClick={handleSubmit}>
          Submit & AI Classify
        </button>
      </div>
    </div>
  );
}

