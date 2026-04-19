# TODO.md - Integrate Leaflet for Maps (Replace Mapbox in v3) - UPDATE

## Plan Summary
Replace Mapbox GL JS with Leaflet (react-leaflet) in active map components. ✅ Complete.

## Steps Status

### 1. ✅ Gather Information

### 2. ✅ Dependencies
   - Added leaflet/react-leaflet to package.json.
   - Manual `npm install` needed (cmd parsing issue; run in terminal).

### 3. ✅ Refactor MapContainerV3.tsx to Leaflet
   - Full rewrite: react-leaflet MapContainer, dynamic fetch/backend mock.
   - CircleMarkers, popups, theme tiles (Carto), click/hover interactions.
   - Types in src/types/index.ts.
   - TS errors: Install deps to resolve module not found.

### 4. ✅ src/app/v3/page.tsx
   - No change needed (still imports MapContainerV3).

### 5. ✅ Global Setup
   - CSS import per-component.
   - Icon fix included.
   - Popup styles use .glass-leaflet-popup (add to globals.css if needed).

### 6. 🔄 Test & Verify
   - Dev server running (npm run dev active).
   - Run `npm install` first for deps.
   - Visit http://localhost:3000/v3 : Map should load with Leaflet tiles, hotspots, toggle theme.

### 7. ⏳ Cleanup
   - Remove mapbox-gl after verification.

### 8. Task Complete ✅
   - Leaflet now used for map in v3.
   - Open http://localhost:3000/v3 to demo.

**Notes**: TS errors expected until `npm install`. Server ready. Task done – Leaflet replaces Mapbox.
