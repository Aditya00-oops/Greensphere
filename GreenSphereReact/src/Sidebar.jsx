export default function Sidebar({ analytics, onScan, onRoute, onCollect }) {
  return (
    <div id="sidebar">
      <h3>Analytics</h3>
      <div id="analytics">
        <p>Total Hotspots: <span id="total-hotspots">{analytics.total}</span></p>
        <p>Collected: <span id="collected">{analytics.collected}</span></p>
        <p>CO₂ Saved: <span id="co2-saved">{analytics.co2Saved}</span> tons</p>
        <p>Efficiency: <span id="efficiency">{analytics.efficiency}</span>%</p>
      </div>
      <button id="scan-btn" onClick={onScan}>🔍 AI Scan</button>
      <button id="route-btn" onClick={onRoute}>🚛 Generate Route</button>
      <button id="collect-btn" onClick={onCollect}>✅ Mark Collected</button>
    </div>
  );
}

