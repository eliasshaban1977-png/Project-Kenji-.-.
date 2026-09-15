import React, { useState, useRef, useMemo } from 'react';
import { SanctuaryMapPoint } from './MudosVisualizer';
import { Crosshair, MapPin, Sun, Moon, Info, ZoomIn, ZoomOut, RotateCcw, Compass } from 'lucide-react';

interface VectorCartographicMapProps {
  latitudeDeg: number;
  longitudeDeg: number;
  subsolarLat: number;
  subsolarLng: number;
  sublunarLat: number;
  sublunarLng: number;
  qiblaBearingDeg: number;
  qiblaDistanceKm: number;
  sanctuaryPoints: SanctuaryMapPoint[];
  selectedPoint: SanctuaryMapPoint | null;
  onSelectPoint: (pt: SanctuaryMapPoint | null) => void;
  showCelestialProjections: boolean;
  onLogMessage: (msg: string) => void;
  onApplyApiKey?: (key: string) => void;
  hasAuthError?: boolean;
}

// Simplified high-contrast world coastlines / landmass SVG paths for equirectangular projection (-180 to 180 lng, 90 to -90 lat)
// Mapped to viewBox="0 0 1000 500" where x = (lng + 180) * (1000/360), y = (90 - lat) * (500/180)
const WORLD_CONTINENTS_PATHS = [
  // North America
  "M 150,60 L 220,50 L 260,70 L 280,110 L 240,160 L 220,180 L 240,220 L 220,240 L 210,210 L 180,180 L 150,150 L 110,90 Z",
  // Greenland
  "M 330,30 L 380,35 L 360,80 L 320,70 Z",
  // South America
  "M 240,240 L 280,260 L 330,290 L 320,360 L 290,430 L 270,450 L 260,390 L 240,300 Z",
  // Europe
  "M 470,80 L 520,70 L 560,90 L 550,130 L 510,140 L 480,150 L 460,120 Z",
  // Africa
  "M 470,160 L 540,160 L 590,200 L 590,260 L 550,340 L 510,380 L 480,340 L 460,250 L 450,180 Z",
  // Asia
  "M 560,80 L 680,60 L 780,80 L 860,110 L 830,170 L 770,190 L 720,240 L 680,200 L 630,220 L 600,170 L 570,140 Z",
  // Arabian Peninsula (detailed around Red Sea & Gulf)
  "M 580,175 L 615,185 L 630,220 L 600,245 L 585,225 L 575,190 Z",
  // Australia
  "M 790,320 L 870,320 L 880,380 L 830,410 L 780,380 Z",
  // Antarctica
  "M 50,470 L 950,470 L 950,495 L 50,495 Z"
];

export const VectorCartographicMap: React.FC<VectorCartographicMapProps> = ({
  latitudeDeg,
  longitudeDeg,
  subsolarLat,
  subsolarLng,
  sublunarLat,
  sublunarLng,
  qiblaBearingDeg,
  qiblaDistanceKm,
  sanctuaryPoints,
  selectedPoint,
  onSelectPoint,
  showCelestialProjections,
  onLogMessage,
  onApplyApiKey,
  hasAuthError,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewTransform, setViewTransform] = useState({ scale: 1.0, panX: 0, panY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  // Convert geographic coordinates (Lat, Lng) to SVG map coordinates (width 1000, height 500)
  const coordsToSvg = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const observerSvg = useMemo(() => coordsToSvg(latitudeDeg, longitudeDeg), [latitudeDeg, longitudeDeg]);
  const kaabaSvg = useMemo(() => coordsToSvg(21.4225, 39.8262), []);
  const subsolarSvg = useMemo(() => coordsToSvg(subsolarLat, subsolarLng), [subsolarLat, subsolarLng]);
  const sublunarSvg = useMemo(() => coordsToSvg(sublunarLat, sublunarLng), [sublunarLat, sublunarLng]);

  // Compute Qibla Geodesic Arc SVG Path
  const qiblaArcPath = useMemo(() => {
    const p1 = observerSvg;
    const p2 = kaabaSvg;
    // Midpoint with curve offset
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2 - 25;
    return `M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }, [observerSvg, kaabaSvg]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewTransform.panX, y: e.clientY - viewTransform.panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewTransform((prev) => ({
      ...prev,
      panX: e.clientX - dragStart.x,
      panY: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setViewTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.3, 5.0) }));
  };

  const handleZoomOut = () => {
    setViewTransform((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.3, 0.7) }));
  };

  const handleReset = () => {
    setViewTransform({ scale: 1.0, panX: 0, panY: 0 });
    onLogMessage('[CARTOGRAPHY] Map camera reset to global projection centered on Equator / Prime Meridian.');
  };

  const handleFocusObserver = () => {
    // Center viewport on observer
    const targetX = 500 - observerSvg.x;
    const targetY = 250 - observerSvg.y;
    setViewTransform({ scale: 2.0, panX: targetX * 2.0, panY: targetY * 2.0 });
    onLogMessage(`[CARTOGRAPHY] Focused on Observer position: ${latitudeDeg.toFixed(4)}° N, ${longitudeDeg.toFixed(4)}° E.`);
  };

  return (
    <div className="relative w-full h-full bg-[#030708] overflow-hidden select-none font-mono">
      {/* Notice Banner when API Key is missing or invalid */}
      <div className="absolute top-2 inset-x-3 z-30 bg-[#121212]/95 border border-[#b87333]/80 rounded p-2 text-xs shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-[#00ffaa] flex-shrink-0" />
          <span className="text-gray-300 text-[10px]">
            {hasAuthError
              ? 'Google Maps API Project Map Error: Live tiles paused. High-Precision Vector Cartography active.'
              : 'Google Maps API key not detected. High-Precision Vector Cartographic Engine active with real-world coordinates.'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyPrompt(!showKeyPrompt)}
            className="px-2 py-0.5 text-[9px] bg-[#1a1a1a] hover:bg-[#b87333] text-[#00ffaa] hover:text-black border border-[#b87333] rounded transition-colors"
          >
            {showKeyPrompt ? 'HIDE KEY INPUT' : 'ENTER API KEY'}
          </button>
        </div>
      </div>

      {/* Key Input Modal / Dropdown */}
      {showKeyPrompt && (
        <div className="absolute top-12 right-3 z-30 bg-[#0a0a0a] border border-[#00ffaa] rounded p-3 w-80 shadow-2xl">
          <div className="text-[11px] font-bold text-[#00ffaa] mb-1">CONFIGURE GOOGLE MAPS API KEY</div>
          <p className="text-[9px] text-gray-400 mb-2 leading-relaxed">
            Provide a Google Maps Platform API key with the Maps JavaScript API enabled to activate live satellite & hybrid tiles.
          </p>
          <div className="flex gap-1.5">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className="flex-1 bg-[#151515] border border-gray-700 px-2 py-1 text-xs text-white rounded font-mono focus:border-[#00ffaa] outline-none"
            />
            <button
              onClick={() => {
                if (tempKeyInput.trim() && onApplyApiKey) {
                  onApplyApiKey(tempKeyInput.trim());
                  setShowKeyPrompt(false);
                }
              }}
              className="px-2.5 py-1 text-[10px] font-bold bg-[#00ffaa] text-black rounded hover:bg-white transition-colors"
            >
              APPLY
            </button>
          </div>
        </div>
      )}

      {/* Interactive SVG World Map Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="cartoGrid" width="55.55" height="55.55" patternUnits="userSpaceOnUse">
            <path d="M 55.55 0 L 0 0 0 55.55" fill="none" stroke="#00ffaa" strokeWidth="0.3" strokeOpacity="0.1" />
          </pattern>
          {/* Radial Glows */}
          <radialGradient id="observerGlow">
            <stop offset="0%" stopColor="#00ffaa" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00ffaa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00ffaa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="kaabaGlow">
            <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#b87333" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#b87333" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Scaled & Panned Group */}
        <g transform={`translate(${viewTransform.panX}, ${viewTransform.panY}) scale(${viewTransform.scale})`}>
          {/* Ocean Background */}
          <rect x="0" y="0" width="1000" height="500" fill="#04080a" />
          <rect x="0" y="0" width="1000" height="500" fill="url(#cartoGrid)" />

          {/* Meridian and Parallel Reference Rings */}
          {/* Equator (0° Lat) */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#b87333" strokeWidth="0.8" strokeDasharray="4 2" strokeOpacity="0.7" />
          <text x="10" y="246" fill="#b87333" fontSize="8" opacity="0.8">EQUATOR 0°</text>

          {/* Tropic of Cancer (+23.44° Lat) */}
          <line x1="0" y1="185" x2="1000" y2="185" stroke="#ffaa00" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.4" />
          <text x="10" y="181" fill="#ffaa00" fontSize="7" opacity="0.6">+23.44° TROPIC OF CANCER</text>

          {/* Tropic of Capricorn (-23.44° Lat) */}
          <line x1="0" y1="315" x2="1000" y2="315" stroke="#ffaa00" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.4" />
          <text x="10" y="311" fill="#ffaa00" fontSize="7" opacity="0.6">-23.44° TROPIC OF CAPRICORN</text>

          {/* Prime Meridian (0° Lng) */}
          <line x1="500" y1="0" x2="500" y2="500" stroke="#00ffaa" strokeWidth="0.6" strokeDasharray="4 2" strokeOpacity="0.5" />
          <text x="504" y="20" fill="#00ffaa" fontSize="7" opacity="0.7">PRIME MERIDIAN 0°</text>

          {/* Solar Declination Parallel Line */}
          {(() => {
            const solarY = ((90 - subsolarLat) / 180) * 500;
            return (
              <g>
                <line x1="0" y1={solarY} x2="1000" y2={solarY} stroke="#ffcc00" strokeWidth="1" strokeDasharray="5 3" strokeOpacity="0.8" />
                <text x="10" y={solarY - 3} fill="#ffcc00" fontSize="8" fontWeight="bold">
                  SOLAR ZENITH DECLINATION: {subsolarLat > 0 ? `+${subsolarLat.toFixed(2)}°` : `${subsolarLat.toFixed(2)}°`}
                </text>
              </g>
            );
          })()}

          {/* Continents & Landmass Outlines */}
          <g fill="#0e1b1d" stroke="#1d3f44" strokeWidth="1.2">
            {WORLD_CONTINENTS_PATHS.map((pathStr, idx) => (
              <path key={idx} d={pathStr} />
            ))}
          </g>

          {/* Qibla Geodesic Arc Connecting Observer to Ka'aba */}
          <path
            d={qiblaArcPath}
            fill="none"
            stroke="#00ffaa"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            className="animate-pulse"
          />

          {/* Sanctuary Map Points (Anchors & Landmarks) */}
          {sanctuaryPoints.map((pt) => {
            const pos = coordsToSvg(pt.lat, pt.lng);
            const isSelected = selectedPoint?.id === pt.id;
            return (
              <g
                key={pt.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPoint(pt);
                  onLogMessage(`[CARTOGRAPHY POI] ${pt.title} | ${pt.description}`);
                }}
                className="cursor-pointer"
              >
                <circle r={isSelected ? 8 : 4} fill={pt.color} stroke="#ffffff" strokeWidth={isSelected ? 1.5 : 0.8} />
                {isSelected && (
                  <circle r={14} fill="none" stroke={pt.color} strokeWidth="1" strokeDasharray="3 2" className="animate-spin" />
                )}
                <text x="6" y="3" fill="#ffffff" fontSize="7" fontWeight="bold" opacity="0.8">
                  {pt.title}
                </text>
              </g>
            );
          })}

          {/* Holy Ka'aba Sanctuary Beacon */}
          <g transform={`translate(${kaabaSvg.x}, ${kaabaSvg.y})`}>
            <circle r={20} fill="url(#kaabaGlow)" />
            <rect x="-5" y="-5" width="10" height="10" fill="#000000" stroke="#ffaa00" strokeWidth="1.5" />
            <circle r={2} fill="#ffaa00" />
            <text x="9" y="-4" fill="#ffaa00" fontSize="8" fontWeight="bold">
              KA'ABA (BAYT ALLAH)
            </text>
          </g>

          {/* Celestial Projections: Sub-solar Nadir */}
          {showCelestialProjections && (
            <g transform={`translate(${subsolarSvg.x}, ${subsolarSvg.y})`}>
              <circle r={12} fill="#ffaa00" fillOpacity="0.2" />
              <circle r={4} fill="#ffff00" stroke="#ffaa00" strokeWidth="1.2" />
              <text x="7" y="3" fill="#ffaa00" fontSize="7" fontWeight="bold">
                SOL NADIR ({subsolarLat.toFixed(1)}°)
              </text>
            </g>
          )}

          {/* Celestial Projections: Sub-lunar Nadir */}
          {showCelestialProjections && (
            <g transform={`translate(${sublunarSvg.x}, ${sublunarSvg.y})`}>
              <circle r={10} fill="#88ccff" fillOpacity="0.2" />
              <circle r={3} fill="#ffffff" stroke="#88ccff" strokeWidth="1" />
              <text x="6" y="3" fill="#88ccff" fontSize="7">
                LUNA ({sublunarLat.toFixed(1)}°)
              </text>
            </g>
          )}

          {/* Observer Target Reticle at (latitudeDeg, longitudeDeg) */}
          <g transform={`translate(${observerSvg.x}, ${observerSvg.y})`}>
            <circle r={22} fill="url(#observerGlow)" />
            <circle r={8} fill="none" stroke="#00ffaa" strokeWidth="1.5" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#00ffaa" strokeWidth="1.2" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#00ffaa" strokeWidth="1.2" />
            <circle r={2} fill="#00ffaa" />
            <text x="12" y="14" fill="#00ffaa" fontSize="8" fontWeight="bold">
              OBSERVER ({latitudeDeg.toFixed(2)}°, {longitudeDeg.toFixed(2)}°)
            </text>
          </g>
        </g>
      </svg>

      {/* Floating Tactical Telemetry HUD */}
      <div className="absolute top-12 left-3 bg-black/85 backdrop-blur-md border border-[#b87333] rounded p-2.5 text-[10px] text-gray-300 max-w-[260px] pointer-events-auto shadow-2xl">
        <div className="text-[#00ffaa] font-bold text-[10px] flex items-center gap-1.5 border-b border-gray-700 pb-1 mb-1.5">
          <Compass size={12} />
          <span>GEODESIC CARTOGRAPHY HUD</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Observer Latitude:</span>
            <span className="text-white font-bold">{latitudeDeg.toFixed(4)}° N</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Observer Longitude:</span>
            <span className="text-white font-bold">{longitudeDeg.toFixed(4)}° E</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Qibla Heading:</span>
            <span className="text-[#00ffaa] font-bold">{qiblaBearingDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Geodesic Range:</span>
            <span className="text-[#ffaa00] font-bold">{qiblaDistanceKm.toFixed(0)} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Solar Declination:</span>
            <span className="text-[#88ccff]">{subsolarLat > 0 ? `+${subsolarLat.toFixed(2)}°` : `${subsolarLat.toFixed(2)}°`}</span>
          </div>
        </div>
      </div>

      {/* Selected Landmark Info Card */}
      {selectedPoint && (
        <div className="absolute bottom-3 left-3 bg-black/90 border border-[#ffaa00] rounded p-2.5 max-w-[280px] shadow-xl text-left">
          <div className="flex items-center justify-between border-b border-gray-700 pb-1 mb-1">
            <span className="text-[#ffaa00] font-bold text-xs">{selectedPoint.title}</span>
            <button
              onClick={() => onSelectPoint(null)}
              className="text-gray-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          {selectedPoint.quranRef && (
            <div className="text-[#00ffaa] text-[10px] font-semibold mb-1">
              {selectedPoint.quranRef}
            </div>
          )}
          <div className="text-gray-300 text-[10px] leading-tight mb-1">
            {selectedPoint.description}
          </div>
          <div className="text-gray-500 text-[9px]">
            Coords: {selectedPoint.lat.toFixed(4)}° N, {selectedPoint.lng.toFixed(4)}° E
          </div>
        </div>
      )}

      {/* Map Control Buttons (Zoom & Focus) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
        <button
          onClick={handleFocusObserver}
          className="p-1.5 bg-[#112211] text-[#00ffaa] border border-[#00ffaa] rounded hover:bg-[#00ffaa] hover:text-black transition-colors"
          title="Center on Observer"
        >
          <Crosshair size={14} />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1.5 bg-[#1a1a1a] text-white border border-gray-700 rounded hover:border-[#b87333] transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 bg-[#1a1a1a] text-white border border-gray-700 rounded hover:border-[#b87333] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 bg-[#1a1a1a] text-white border border-gray-700 rounded hover:border-[#b87333] transition-colors"
          title="Reset View"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
