/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MudosVisualizer } from './components/MudosVisualizer';
import { QuranReferenceSection } from './components/QuranReferenceSection';
import { TerminalPanel } from './components/TerminalPanel';
import { KOTLIN_CODE_STRING } from './data/kotlinCode';
import {
  setCookie,
  calculateSolarDeclination,
  computeDawnDuskBarrier,
  calculateTerminatorBarrier,
  cartographyBases,
} from './utils/solarEngine';
import { TerminalLogEntry } from './types';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';

const GITHUB_GATEWAY = 'https://github.com/gatesfoundation/engineering-prototype-cartography';

export default function App() {
  // Navigation & Zoom State
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Time & Position Simulation State
  const [dayOfYear, setDayOfYear] = useState<number>(79); // Default near Vernal Equinox
  const [latitudeDeg, setLatitudeDeg] = useState<number>(21.4225); // Makkah Sanctuary Latitude
  const [longitudeDeg, setLongitudeDeg] = useState<number>(39.8262); // Makkah Longitude
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Selection & Layer Visibility
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [showKotlinCode, setShowKotlinCode] = useState<boolean>(true);
  const [copiedKotlin, setCopiedKotlin] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  const [layers, setLayers] = useState({
    showOrbits: true,
    showBarrier: true,
    showGrid: true,
    showYusufStars: true,
    showSanctuary: true,
    showBucketNav: true,
    showSiriusSpikes: true,
    showSatelliteOverlay: false,
  });

  // Terminal Log State
  const [logs, setLogs] = useState<TerminalLogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      message: '[SYSTEM INITIALIZED] Synchronizing 4 Mountain Bases with Safa & Marwa Celestial Zenith Canopy...',
      type: 'system',
    },
  ]);
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);

  // Initialize Platform Cookies & 4-Bases Dawn/Dusk Barrier Calculations on Mount
  useEffect(() => {
    try {
      setCookie('cartography_platform_primary', 'GOOGLE_MAPS_EARTH_ENHANCEMENT', 30);
      setCookie('cartography_partner_secondary', 'GATES_FOUNDATION_REAR_STACK', 30);
      setCookie('cartography_ms_angle_attached', 'ACTIVE_STATE_TRUE', 30);
      addLogEntry('[PLATFORM HOOKS] Primary & secondary ecosystem cookies initialized.');
      // Execute initial dawn/dusk barrier alignment calculation across the 4 bases (Quran 2:260)
      calculateTerminatorBarrier(Date.now(), dayOfYear, addLogEntry);
    } catch {
      // safe fallback
    }
  }, []);

  const addLogEntry = useCallback(
    (message: string, type: TerminalLogEntry['type'] = 'info') => {
      if (isStreamPaused) return;
      const newEntry: TerminalLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      };
      setLogs((prev) => {
        const next = [...prev, newEntry];
        if (next.length > 200) {
          return next.slice(next.length - 200);
        }
        return next;
      });
    },
    [isStreamPaused]
  );

  // Partner Redirect Routine
  const handlePartnerRedirect = () => {
    addLogEntry('[PARTNER ROUTING] Executing partner routing routine...', 'action');
    addLogEntry('[PARTNER ROUTING] Target: https://github.com/gatesfoundation/engineering-prototype-cartography', 'action');
    setCookie('cartography_redirect_click', 'PRIMARY_GOOGLE_ROUTE', 7);
    window.open(GITHUB_GATEWAY, '_blank', 'noopener,noreferrer');
  };

  // Boolean West Button (Zoom In)
  const triggerBooleanWest = () => {
    const nextZoom = Math.min(Number((zoomScale + 0.15).toFixed(2)), 2.5);
    setZoomScale(nextZoom);
    setCookie('cartography_zoom_mode', 'WEST_ZOOM_IN', 7);
    addLogEntry(`[BOOLEAN WEST] Zoom Scale: ${nextZoom.toFixed(2)}x`, 'telemetry');
  };

  // Boolean East Button (Zoom Out)
  const triggerBooleanEast = () => {
    const nextZoom = Math.max(Number((zoomScale - 0.15).toFixed(2)), 0.5);
    setZoomScale(nextZoom);
    setCookie('cartography_zoom_mode', 'EAST_ZOOM_OUT', 7);
    addLogEntry(`[BOOLEAN EAST] Zoom Scale: ${nextZoom.toFixed(2)}x`, 'telemetry');
  };

  // Copy Kotlin Code
  const handleCopyKotlin = () => {
    navigator.clipboard.writeText(KOTLIN_CODE_STRING).then(() => {
      setCopiedKotlin(true);
      addLogEntry('[SOURCE CODE] Kotlin telemetry engine source code copied to clipboard.', 'info');
      setTimeout(() => setCopiedKotlin(false), 2000);
    });
  };

  // Solar calculation metrics for display
  const decResult = calculateSolarDeclination(dayOfYear);
  const barrierState = computeDawnDuskBarrier(latitudeDeg, longitudeDeg, decResult, 0);

  // Season name helper
  const getSeasonInfo = (day: number) => {
    if (day >= 79 && day < 172) return 'Spring (Equinox Pass)';
    if (day >= 172 && day < 265) return 'Summer (Solstice Peak)';
    if (day >= 265 && day < 355) return 'Autumn (Equinox Pass)';
    return 'Winter (Solstice Nadir)';
  };

  return (
    <div className="min-h-screen bg-[#010101] text-[#b87333] flex flex-col items-center p-3 sm:p-5 selection:bg-[#00ffaa]/20 selection:text-white">
      {/* Outer Chassis Tier 3 Frame */}
      <div className="chassis-tier-3 relative w-full max-w-[940px] p-4 sm:p-6 rounded border-8 border-[#4a4a4a] bg-[#050505] shadow-[inset_0_0_25px_rgba(184,115,51,0.5),0_0_25px_rgba(184,115,51,0.4)] box-border">
        
        {/* Top Right Bimetallic Press Zone */}
        <div
          id="bimetallic-press-zone"
          className="bimetallic-press-zone absolute top-3 right-3 sm:top-4 sm:right-4 w-[140px] sm:w-[155px] h-[45px] rounded border-2 border-white cursor-pointer shadow-[0_0_10px_#b87333] flex flex-col justify-center items-center text-[10px] font-bold text-white tracking-wider leading-tight select-none z-10 hover:brightness-125 transition-all"
          style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #b87333 100%)' }}
          onClick={handlePartnerRedirect}
          title="Open Engineering Portal & Partner Routing Gateway"
        >
          <span>ENGINEERING PORTAL</span>
          <span className="text-[9px] text-[#ffffff] font-bold">PARTNER ROUTING</span>
        </div>

        {/* Dashboard Header */}
        <header id="dashboard" className="mt-1 sm:mt-2 text-center pr-[145px] sm:pr-[165px]">
          <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-wider text-[#b87333] uppercase leading-tight font-mono">
            MUDOS-6G CARTOGRAPHY // 4-MOUNTAIN BASE & SAFA-MARWA CANOPY
          </h1>
          <div className="text-[#00ffaa] text-[11px] sm:text-[12px] font-bold mt-1 tracking-wide">
            Audhu billahi minash shaitanir rajim | Bismillahirrahmanirrahim
          </div>
          <div className="text-[#ffff00] text-[10px] sm:text-[11px] mt-1 font-mono">
            4-Peak Mountain Grid | Zenith Canopy Anchor: Safa & Marwa (2:158)
          </div>
        </header>

        {/* Dynamic Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-2 bg-[#090909] border border-[#4a4a4a] rounded text-[10px] font-mono text-center">
          <div className="border-r border-[#222] last:border-r-0">
            <span className="text-gray-400 block text-[9px]">SOLAR DECLINATION (δ)</span>
            <span className="text-[#00ffaa] font-bold text-[11px]">
              {decResult.declinationDeg > 0 ? `+${decResult.declinationDeg.toFixed(2)}°` : `${decResult.declinationDeg.toFixed(2)}°`}
            </span>
          </div>
          <div className="border-r border-[#222] last:border-r-0">
            <span className="text-gray-400 block text-[9px]">SEASONAL AXIAL TILT (ε)</span>
            <span className="text-[#ffaa00] font-bold text-[11px]">{decResult.axialTiltDeg.toFixed(3)}°</span>
          </div>
          <div className="border-r border-[#222] last:border-r-0">
            <span className="text-gray-400 block text-[9px]">EQUATION OF TIME</span>
            <span className="text-[#88ccff] font-bold text-[11px]">{decResult.equationOfTimeMinutes.toFixed(1)} min</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[9px]">CURRENT CYCLE</span>
            <span className="text-[#d1d5db] font-bold text-[10px]">{getSeasonInfo(dayOfYear)}</span>
          </div>
        </div>

        {/* The 4 Geodesic Mountain Bases & Safa-Marwa Canopy Quick Alignment Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 mb-3 bg-[#0c1210] border border-[#b87333]/70 rounded font-mono text-[10px]">
          <div className="flex items-center gap-1.5 text-[#ffaa00] font-bold">
            <Sparkles size={13} className="text-[#00ffaa]" />
            <span className="hidden sm:inline">CELESTIAL GRID ALIGNMENT:</span>
            <span className="sm:hidden">ALIGN:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-end">
            <button
              onClick={() => {
                setLatitudeDeg(21.4229);
                setLongitudeDeg(39.8262);
                setHighlightedNodeId('CANOPY_ZENITH');
                addLogEntry(`[CANOPY LOCK] Aligned observer to Stellar Canopy Zenith (Safa & Marwa) [21.4229°, 39.8262°].`, 'action');
                calculateTerminatorBarrier(Date.now(), dayOfYear, addLogEntry);
              }}
              className={`px-2 py-1 rounded border text-[9px] font-bold transition-all flex items-center gap-1 ${
                Math.abs(latitudeDeg - 21.4229) < 0.005 && Math.abs(longitudeDeg - 39.8262) < 0.005
                  ? 'bg-[#88ccff] text-black border-[#88ccff] shadow-[0_0_8px_#88ccff]'
                  : 'bg-[#101b22] text-[#88ccff] border-[#88ccff]/50 hover:border-[#88ccff] hover:text-white'
              }`}
              title="Stellar Canopy Zenith: Safa & Marwa (Quran 2:158)"
            >
              <span>CANOPY (SAFA & MARWA)</span>
            </button>
            {cartographyBases.map((b) => {
              const isSelected = Math.abs(latitudeDeg - b.lat) < 0.01 && Math.abs(longitudeDeg - b.lng) < 0.01;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setLatitudeDeg(b.lat);
                    setLongitudeDeg(b.lng);
                    setHighlightedNodeId(b.id.toUpperCase());
                    addLogEntry(`[BASE LOCK] Aligned observer to ${b.name} [${b.lat}, ${b.lng}].`, 'action');
                    calculateTerminatorBarrier(Date.now(), dayOfYear, addLogEntry);
                  }}
                  className={`px-2 py-1 rounded border text-[9px] font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#00ffaa] text-black border-[#00ffaa] shadow-[0_0_8px_#00ffaa]'
                      : 'bg-[#151d1a] text-gray-300 border-[#2f4f4f] hover:border-[#00ffaa] hover:text-white'
                  }`}
                  title={`${b.name} (${b.description})`}
                >
                  <span>{b.id.toUpperCase()}</span>
                  <span className="hidden md:inline">({b.name.split(':')[1]?.trim().split('(')[0] || b.name})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Mudos Visualizer Canvas */}
        <MudosVisualizer
          dayOfYear={dayOfYear}
          latitudeDeg={latitudeDeg}
          longitudeDeg={longitudeDeg}
          zoomScale={zoomScale}
          isPlaying={isPlaying}
          simSpeed={simSpeed}
          highlightedNodeId={highlightedNodeId}
          onSelectNode={(id) => setHighlightedNodeId(id)}
          onLogMessage={addLogEntry}
          layers={layers}
        />

        {/* Boolean Navigation Bar */}
        <div className="boolean-nav-bar flex justify-between gap-3 mt-3 mb-3">
          <button
            id="btn-boolean-west"
            className="btn-boolean flex-1 bg-[#111] text-[#00ffaa] border-2 border-[#b87333] py-2.5 px-3 sm:px-4 font-mono font-bold cursor-pointer shadow-[0_0_8px_rgba(0,255,170,0.2)] hover:bg-[#b87333] hover:text-black transition-all text-[11px] sm:text-[12px] flex items-center justify-center gap-1"
            onClick={triggerBooleanWest}
          >
            <span>&#9668;</span> BOOLEAN WEST (ZOOM IN / COOKIE SET)
          </button>
          <button
            id="btn-boolean-east"
            className="btn-boolean flex-1 bg-[#111] text-[#00ffaa] border-2 border-[#b87333] py-2.5 px-3 sm:px-4 font-mono font-bold cursor-pointer shadow-[0_0_8px_rgba(0,255,170,0.2)] hover:bg-[#b87333] hover:text-black transition-all text-[11px] sm:text-[12px] flex items-center justify-center gap-1"
            onClick={triggerBooleanEast}
          >
            BOOLEAN EAST (ZOOM OUT / COOKIE SET) <span>&#9658;</span>
          </button>
        </div>

        {/* Simulation Control Drawer */}
        <div className="bg-[#090909] border border-[#4a4a4a] rounded p-3 my-3 text-left">
          <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className="flex items-center gap-2 text-xs font-bold text-[#00ffaa] uppercase tracking-wider font-mono hover:text-white"
            >
              <Sliders size={14} />
              <span>Celestial Engine Controls & Orbital Parameters</span>
              {showControls ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  addLogEntry(`[SIMULATION] Orbit animation ${!isPlaying ? 'RESUMED' : 'PAUSED'}.`);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono border rounded ${
                  isPlaying
                    ? 'bg-[#111] border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/20'
                    : 'bg-[#ffaa00] text-black border-[#ffaa00] font-bold'
                }`}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={() => {
                  setDayOfYear(79);
                  setZoomScale(1.0);
                  setLatitudeDeg(21.4225);
                  setLongitudeDeg(39.8262);
                  addLogEntry('[SIMULATION RESET] Reverted to Vernal Equinox & Makkah Anchor (21.42° N, 39.83° E).');
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-[#111] border border-[#4a4a4a] text-gray-400 hover:text-white rounded"
                title="Reset simulation defaults"
              >
                <RotateCcw size={11} />
                RESET
              </button>
            </div>
          </div>

          {showControls && (
            <div className="space-y-3 pt-1 text-[11px] font-mono">
              {/* Day of Year & Solstice Quick Select */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-300">
                  <span className="flex items-center gap-1 text-[#ffaa00]">
                    <Sun size={12} /> Day of Year: <strong className="text-white">{dayOfYear}</strong> / 366
                  </span>
                  <span className="text-[#88ccff]">
                    Declination: <strong>{decResult.declinationDeg.toFixed(2)}°</strong>
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="366"
                  value={dayOfYear}
                  onChange={(e) => {
                    const d = parseInt(e.target.value, 10);
                    setDayOfYear(d);
                    const dec = calculateSolarDeclination(d);
                    addLogEntry(`[CALENDAR ADJUST] Day ${d}/365 | Solar Declination: ${dec.declinationDeg.toFixed(2)}°`);
                  }}
                  className="w-full accent-[#00ffaa] bg-[#222] h-1.5 rounded cursor-pointer"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => { setDayOfYear(79); addLogEntry('[SOLAR EQUINOX] Vernal Equinox locked (Day 79).'); }}
                    className="text-[9px] px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-[#00ffaa] rounded"
                  >
                    Vernal Equinox (Day 79, δ≈0°)
                  </button>
                  <button
                    onClick={() => { setDayOfYear(172); addLogEntry('[SOLAR SOLSTICE] Summer Solstice locked (Day 172, δ≈+23.4°).'); }}
                    className="text-[9px] px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-[#ffaa00] rounded"
                  >
                    Summer Solstice (Day 172, δ≈+23.4°)
                  </button>
                  <button
                    onClick={() => { setDayOfYear(265); addLogEntry('[SOLAR EQUINOX] Autumnal Equinox locked (Day 265, δ≈0°).'); }}
                    className="text-[9px] px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-[#00ffaa] rounded"
                  >
                    Autumn Equinox (Day 265, δ≈0°)
                  </button>
                  <button
                    onClick={() => { setDayOfYear(355); addLogEntry('[SOLAR SOLSTICE] Winter Solstice locked (Day 355, δ≈-23.4°).'); }}
                    className="text-[9px] px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-[#88ccff] rounded"
                  >
                    Winter Solstice (Day 355, δ≈-23.4°)
                  </button>
                </div>
              </div>

              {/* Coordinates and Speed Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1a1a1a]">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">
                    Observer Latitude: <span className="text-[#00ffaa]">{latitudeDeg.toFixed(2)}°</span>
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="0.5"
                    value={latitudeDeg}
                    onChange={(e) => setLatitudeDeg(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] bg-[#222] h-1.5 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-gray-500">
                    <span>-90° (South)</span>
                    <span>0° (Equator)</span>
                    <span>+90° (North)</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">
                    Simulation Speed: <span className="text-[#ffaa00]">{simSpeed}x</span>
                  </label>
                  <div className="flex gap-1">
                    {[0.5, 1, 2, 5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setSimSpeed(spd)}
                        className={`flex-1 py-0.5 text-[10px] border rounded ${
                          simSpeed === spd
                            ? 'bg-[#00ffaa] text-black font-bold border-[#00ffaa]'
                            : 'bg-[#111] text-gray-300 border-[#4a4a4a] hover:bg-[#222]'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">
                    Observer Longitude: <span className="text-[#88ccff]">{longitudeDeg.toFixed(2)}°</span>
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={longitudeDeg}
                    onChange={(e) => setLongitudeDeg(parseFloat(e.target.value))}
                    className="w-full accent-[#88ccff] bg-[#222] h-1.5 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-gray-500">
                    <span>-180° (W)</span>
                    <span>0° (Prime)</span>
                    <span>+180° (E)</span>
                  </div>
                </div>
              </div>

              {/* Layer Visibility Toggles */}
              <div className="pt-2 border-t border-[#1a1a1a]">
                <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                  <Layers size={11} />
                  <span>Display Cartographic Overlays:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'showSatelliteOverlay', label: '🛰️ Google Satellite Imagery' },
                    { key: 'showBarrier', label: 'Dawn/Dusk Barrier' },
                    { key: 'showSanctuary', label: 'Sanctuary Ka\'aba' },
                    { key: 'showYusufStars', label: '11 Stars Prostration' },
                    { key: 'showSiriusSpikes', label: 'Sirius Diffraction' },
                    { key: 'showBucketNav', label: 'Bucket Mouth Nav' },
                    { key: 'showOrbits', label: 'Celestial Orbits' },
                    { key: 'showGrid', label: 'Azimuth Grid' },
                  ].map(({ key, label }) => {
                    const active = (layers as any)[key];
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setLayers((prev) => ({
                            ...prev,
                            [key]: !active,
                          }))
                        }
                        className={`text-[9px] px-2 py-0.5 border rounded ${
                          active
                            ? 'bg-[#00ffaa]/15 border-[#00ffaa] text-[#00ffaa]'
                            : 'bg-[#111] border-[#333] text-gray-500 line-through'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Terminal Log Display */}
        <TerminalPanel
          logs={logs}
          onClearLogs={() => setLogs([])}
          isStreamPaused={isStreamPaused}
          onToggleStreamPause={() => setIsStreamPaused(!isStreamPaused)}
        />

        {/* Scriptural References Section with Interactive Locators & Quran 2:260 Overlay */}
        <QuranReferenceSection
          highlightedNodeId={highlightedNodeId}
          dayOfYear={dayOfYear}
          onSelectBase={(lat, lng, baseName) => {
            setLatitudeDeg(lat);
            setLongitudeDeg(lng);
            addLogEntry(`[IBRAHIM 2:260 BASE ALIGNED] Observer coordinates updated to ${baseName} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°).`, 'telemetry');
            calculateTerminatorBarrier(Date.now(), dayOfYear, addLogEntry);
          }}
          onHighlightNode={(nodeId) => {
            setHighlightedNodeId(nodeId);
            if (nodeId) {
              addLogEntry(`[RADAR LOCK] Targeting celestial entity: ${nodeId}. Coordinates pinned.`, 'action');
            } else {
              addLogEntry('[RADAR RELEASE] Target lock released.', 'info');
            }
          }}
        />

        {/* Kotlin Telemetry Engine Source Code Block */}
        <div className="my-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#b87333] tracking-wide font-mono flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#00ffaa]" />
              Kotlin Telemetry, Solar Declination & Navigation Engine
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyKotlin}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-[#111] hover:bg-[#222] text-[#00ffaa] border border-[#4a4a4a] rounded font-mono transition-colors"
                title="Copy Kotlin Code to clipboard"
              >
                {copiedKotlin ? <Check size={12} className="text-[#00ff00]" /> : <Copy size={12} />}
                {copiedKotlin ? 'COPIED' : 'COPY KOTLIN CODE'}
              </button>
              <button
                onClick={() => setShowKotlinCode(!showKotlinCode)}
                className="text-[10px] px-2.5 py-1 bg-[#111] hover:bg-[#222] text-gray-300 border border-[#4a4a4a] rounded font-mono transition-colors"
              >
                {showKotlinCode ? 'COLLAPSE' : 'EXPAND'}
              </button>
            </div>
          </div>

          {showKotlinCode && (
            <div className="relative">
              <pre className="bg-[#0b0b0b] text-[#00ffaa] p-4 border-l-4 border-[#b87333] border border-[#222] overflow-x-auto rounded text-[11px] font-mono leading-relaxed max-h-[380px] overflow-y-auto terminal-scrollbar">
                <code className="language-kotlin">{KOTLIN_CODE_STRING}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer Meta & Coordinate Endpoints */}
        <footer className="mt-8 pt-4 border-t border-[#333] text-[10px] text-gray-400 font-mono flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            PROJECT KENJI CARTOGRAPHY ARCHITECTURE // SPENCER FOURIER ENGINE v6G
          </div>
          <div className="flex items-center gap-3 text-[9px] text-[#b87333]">
            <span>ANCHORS: B1-B3 MERIDIAN</span>
            <span>•</span>
            <span>B2-B4 EQUATOR</span>
            <span>•</span>
            <span className="text-[#00ffaa]">STATUS: ONLINE</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

