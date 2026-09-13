import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  calculateSolarDeclination,
  computeDawnDuskBarrier,
  DEG_TO_RAD,
  RAD_TO_DEG,
} from '../utils/solarEngine';

interface MudosVisualizerProps {
  dayOfYear: number;
  latitudeDeg: number;
  longitudeDeg: number;
  zoomScale: number;
  isPlaying: boolean;
  simSpeed: number;
  highlightedNodeId: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onLogMessage: (msg: string) => void;
  layers: {
    showOrbits: boolean;
    showBarrier: boolean;
    showGrid: boolean;
    showYusufStars: boolean;
    showSanctuary: boolean;
    showBucketNav: boolean;
    showSiriusSpikes: boolean;
  };
}

export const MudosVisualizer: React.FC<MudosVisualizerProps> = ({
  dayOfYear,
  latitudeDeg,
  longitudeDeg,
  zoomScale,
  isPlaying,
  simSpeed,
  highlightedNodeId,
  onSelectNode,
  onLogMessage,
  layers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Orbital simulation state
  const stateRef = useRef({
    sunAngle: Math.PI / 3,
    moonAngle: 0.0,
    siriusAntaresAngle: 0.0,
    pulse: 0.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    hoveredNode: null as string | null,
  });

  const [hoverInfo, setHoverInfo] = useState<{
    title: string;
    description: string;
    coords: string;
    x: number;
    y: number;
  } | null>(null);

  // Constants
  const R_MOON_ORBIT = 100;
  const R_REAR_SPOUT = 120;
  const R_FRONT_SPOUT = 160;
  const R_SUN = 200;
  const R_OUTER_RAIL = 250;
  const R_SIRIUS = 230;

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Update angles if playing
      if (isPlaying) {
        stateRef.current.sunAngle =
          (stateRef.current.sunAngle + 0.002 * simSpeed) % (Math.PI * 2);
        stateRef.current.moonAngle =
          (stateRef.current.moonAngle + 0.0016 * simSpeed) % (Math.PI * 2);
        stateRef.current.siriusAntaresAngle =
          (stateRef.current.siriusAntaresAngle + 0.0008 * simSpeed) %
          (Math.PI * 2);
        stateRef.current.pulse = (stateRef.current.pulse + 0.03) % (Math.PI * 2);
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Clear Canvas
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Radial background
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 450);
      bgGrad.addColorStop(0, '#0a0a0a');
      bgGrad.addColorStop(0.6, '#040404');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Apply Pan & Zoom Transformation
      ctx.translate(
        cx + stateRef.current.panX,
        cy + stateRef.current.panY
      );
      ctx.scale(zoomScale, zoomScale);

      // 1. Grid & Concentric Navigation Rings
      if (layers.showGrid) {
        ctx.save();
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;

        // Concentric distance rings
        const rings = [50, 100, 150, 200, 250, 300, 350];
        rings.forEach((r) => {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();

          // Distance ring label
          ctx.fillStyle = '#3a3a3a';
          ctx.font = '8px "Courier New", monospace';
          ctx.fillText(`R-${r}`, r + 4, -4);
        });

        // 30-degree azimuth radial lines
        for (let a = 0; a < 360; a += 30) {
          const rad = a * DEG_TO_RAD;
          const x1 = Math.cos(rad) * 40;
          const y1 = Math.sin(rad) * 40;
          const x2 = Math.cos(rad) * 360;
          const y2 = Math.sin(rad) * 360;

          ctx.beginPath();
          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = a % 90 === 0 ? '#444444' : '#1f1f1f';
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Azimuth degrees label
          const lx = Math.cos(rad) * 368;
          const ly = Math.sin(rad) * 368;
          ctx.fillStyle = '#555555';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let cardinal = '';
          if (a === 0) cardinal = ' (E)';
          else if (a === 90) cardinal = ' (S)';
          else if (a === 180) cardinal = ' (W)';
          else if (a === 270) cardinal = ' (N)';
          ctx.fillText(`${a.toString().padStart(3, '0')}°${cardinal}`, lx, ly);
        }

        // Major Coordinate Axes: B1-B3 (Meridian) & B2-B4 (Equator)
        // B1-B3 Meridian (North-South)
        ctx.beginPath();
        ctx.strokeStyle = '#b87333';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.moveTo(0, -370);
        ctx.lineTo(0, 370);
        ctx.stroke();

        // B2-B4 Equator (East-West)
        ctx.beginPath();
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.moveTo(-370, 0);
        ctx.lineTo(370, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central intersection indicator
        ctx.beginPath();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Base Anchors (B1, B2, B3, B4)
      const anchors = [
        { label: 'B1: ZENITH MERIDIAN ANCHOR', x: 0, y: -R_OUTER_RAIL, color: '#00ffaa' },
        { label: 'B3: NADIR MERIDIAN ANCHOR', x: 0, y: R_OUTER_RAIL, color: '#00ffaa' },
        { label: 'B2: EAST EQUATORIAL ANCHOR', x: R_OUTER_RAIL, y: 0, color: '#b87333' },
        { label: 'B4: WEST EQUATORIAL ANCHOR', x: -R_OUTER_RAIL, y: 0, color: '#b87333' },
      ];

      anchors.forEach((anc) => {
        ctx.fillStyle = anc.color;
        ctx.beginPath();
        ctx.arc(anc.x, anc.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(anc.label, anc.x + 8, anc.y - 3);
      });

      // 3. Bucket Mouth Nav System (frontSpoutRadius 160, rearSpoutRadius 120, rotating)
      if (layers.showBucketNav) {
        ctx.save();
        const rot = stateRef.current.siriusAntaresAngle;
        ctx.rotate(rot);

        // Front Spout Guide (R=160)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.arc(0, 0, R_FRONT_SPOUT, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        // Rear Spout Guide (R=120)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(184, 115, 51, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.arc(0, 0, R_REAR_SPOUT, (2 * Math.PI) / 3, (4 * Math.PI) / 3);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
      }

      // 4. Orbital Rails for Sun & Moon
      if (layers.showOrbits) {
        ctx.save();
        // Moon Rail
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.arc(0, 0, R_MOON_ORBIT, 0, Math.PI * 2);
        ctx.stroke();

        // Sun Rail
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.arc(0, 0, R_SUN, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Dawn / Dusk Barrier (Terminator)
      const decResult = calculateSolarDeclination(dayOfYear);
      const barrierState = computeDawnDuskBarrier(
        latitudeDeg,
        longitudeDeg,
        decResult,
        stateRef.current.sunAngle
      );

      const sunX = Math.cos(stateRef.current.sunAngle) * R_SUN;
      const sunY = Math.sin(stateRef.current.sunAngle) * R_SUN;

      if (layers.showBarrier) {
        ctx.save();
        const terminatorAngle = stateRef.current.sunAngle + Math.PI / 2;
        const barrierLength = 340;

        const dx = Math.cos(terminatorAngle) * barrierLength;
        const dy = Math.sin(terminatorAngle) * barrierLength;

        // Semi-circle Night wash opposite to Sun
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          340,
          terminatorAngle,
          terminatorAngle + Math.PI
        );
        ctx.closePath();
        ctx.fillStyle = 'rgba(10, 5, 25, 0.28)';
        ctx.fill();
        ctx.restore();

        // Dawn/Dusk Barrier Line with gold -> white -> purple gradient
        const grad = ctx.createLinearGradient(-dx, -dy, dx, dy);
        grad.addColorStop(0, '#ffaa00'); // Dawn Gold
        grad.addColorStop(0.5, '#ffffff'); // Zenith Horizon
        grad.addColorStop(1, '#8844aa'); // Dusk Purple

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(-dx, -dy);
        ctx.lineTo(dx, dy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Normal unit vector projection from barrier towards Sun
        const normLen = 45;
        const normAngle = stateRef.current.sunAngle;
        const nx = Math.cos(normAngle) * normLen;
        const ny = Math.sin(normAngle) * normLen;
        ctx.beginPath();
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Arrowhead for normal vector
        const arrowAngle = Math.atan2(ny, nx);
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(
          nx - 8 * Math.cos(arrowAngle - Math.PI / 6),
          ny - 8 * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
          nx - 8 * Math.cos(arrowAngle + Math.PI / 6),
          ny - 8 * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Barrier Labels
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('◄ DAWN BARRIER (AL-FAJR)', -dx - 10, -dy);

        ctx.fillStyle = '#8844aa';
        ctx.fillText('DUSK BARRIER (AL-GHURUUB) ►', dx + 10, dy);

        ctx.fillStyle = '#00ffaa';
        ctx.font = '8px monospace';
        ctx.fillText('TERMINATOR NORMAL [E,N,U]', nx + 8, ny + 4);

        // Surah Ya-Sin Scriptural Banner above barrier
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          'ORBITAL INDEPENDENCE BARRIER // SURAH YA-SIN [36:40]',
          0,
          -barrierLength - 8
        );
        ctx.restore();
      }

      // 6. Yusuf's 11 Stars (Surah Yusuf 12:4)
      if (layers.showYusufStars) {
        ctx.save();
        const numStars = 11;
        const arcStart = Math.PI * 0.75;
        const arcSpan = Math.PI * 1.5;
        const starRadius = 285;

        for (let i = 0; i < numStars; i++) {
          const angle = arcStart + (i / (numStars - 1)) * arcSpan;
          // Add gentle orbital pulsation
          const pulseOffset = Math.sin(stateRef.current.pulse + i * 0.6) * 3;
          const sx = Math.cos(angle) * (starRadius + pulseOffset);
          const sy = Math.sin(angle) * (starRadius + pulseOffset);

          // Subtle prostration alignment ray toward central sanctuary
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 220, 100, 0.12)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 5]);
          ctx.moveTo(sx, sy);
          ctx.lineTo(0, 0);
          ctx.stroke();
          ctx.setLineDash([]);

          // Star glow
          const starGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
          starGrad.addColorStop(0, '#ffffff');
          starGrad.addColorStop(0.3, '#ffea75');
          starGrad.addColorStop(1, 'rgba(255, 234, 117, 0)');
          ctx.fillStyle = starGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fill();

          // Star Core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Small 4-point sparkle
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx - 5, sy);
          ctx.lineTo(sx + 5, sy);
          ctx.moveTo(sx, sy - 5);
          ctx.lineTo(sx, sy + 5);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ffea75';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`K-${i + 1}`, sx, sy + 10);
        }

        ctx.fillStyle = 'rgba(255, 234, 117, 0.6)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          '11 STARS CELESTIAL PROSTRATION [SURAH YUSUF 12:4]',
          0,
          starRadius + 24
        );
        ctx.restore();
      }

      // 7. Celestial Body: THE MOON (LUNA_01)
      const moonX = Math.cos(stateRef.current.moonAngle) * R_MOON_ORBIT;
      const moonY = Math.sin(stateRef.current.moonAngle) * R_MOON_ORBIT;

      ctx.save();
      // Moon Halo
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 16);
      moonGrad.addColorStop(0, 'rgba(220, 235, 255, 0.9)');
      moonGrad.addColorStop(0.4, 'rgba(136, 204, 255, 0.3)');
      moonGrad.addColorStop(1, 'rgba(136, 204, 255, 0)');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Moon Core
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Lunar shadow (crescent) reflecting relative sun angle
      const relativeAngle = stateRef.current.sunAngle - stateRef.current.moonAngle;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(
        moonX + Math.cos(relativeAngle + Math.PI) * 2,
        moonY + Math.sin(relativeAngle + Math.PI) * 2,
        4.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Label
      ctx.fillStyle = '#88ccff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('LUNA_01 (THE MOON)', moonX + 10, moonY - 4);
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(
        `ORB: ${(stateRef.current.moonAngle * RAD_TO_DEG).toFixed(1)}°`,
        moonX + 10,
        moonY + 6
      );
      ctx.restore();

      // 8. Celestial Body: THE SUN (SOL_01)
      ctx.save();
      // Solar Corona Flare
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 28);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.2, '#ffea00');
      sunGrad.addColorStop(0.6, 'rgba(255, 120, 0, 0.4)');
      sunGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Sun Core
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Solar Corona Pulsing Rays
      const rayCount = 8;
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
      ctx.lineWidth = 1;
      for (let r = 0; r < rayCount; r++) {
        const rAng = stateRef.current.pulse * 0.5 + (r * Math.PI) / (rayCount / 2);
        ctx.beginPath();
        ctx.moveTo(
          sunX + Math.cos(rAng) * 9,
          sunY + Math.sin(rAng) * 9
        );
        ctx.lineTo(
          sunX + Math.cos(rAng) * 17,
          sunY + Math.sin(rAng) * 17
        );
        ctx.stroke();
      }

      // Solar vector to Ka'aba center
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SOL_01 (THE SUN)', sunX + 14, sunY - 6);
      ctx.fillStyle = '#ffcc88';
      ctx.font = '8px monospace';
      ctx.fillText(`DEC: ${decResult.declinationDeg.toFixed(2)}°`, sunX + 14, sunY + 5);
      ctx.fillText(
        `ORB: ${(stateRef.current.sunAngle * RAD_TO_DEG).toFixed(1)}°`,
        sunX + 14,
        sunY + 15
      );
      ctx.restore();

      // 9. SIRIUS BEACON (Alpha Canis Majoris / Rabbu ash-Shi'ra, An-Najm 53:49)
      const siriusAngle = stateRef.current.siriusAntaresAngle + Math.PI / 4;
      const siriusX = Math.cos(siriusAngle) * R_SIRIUS;
      const siriusY = Math.sin(siriusAngle) * R_SIRIUS;

      ctx.save();
      // Sirius Halo (multi-layer brilliant blue/white)
      const siriusRadius = 14;
      const sHaloGrad = ctx.createRadialGradient(
        siriusX,
        siriusY,
        0,
        siriusX,
        siriusY,
        siriusRadius * 2.8
      );
      sHaloGrad.addColorStop(0, '#ffffff');
      sHaloGrad.addColorStop(0.3, '#88ccff');
      sHaloGrad.addColorStop(0.7, 'rgba(0, 150, 255, 0.25)');
      sHaloGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');
      ctx.fillStyle = sHaloGrad;
      ctx.beginPath();
      ctx.arc(siriusX, siriusY, siriusRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Sirius Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(siriusX, siriusY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Diffraction Spikes for brightest star in night sky
      if (layers.showSiriusSpikes) {
        ctx.strokeStyle = 'rgba(200, 235, 255, 0.85)';
        ctx.lineWidth = 1;
        const spikeLen = 32 + Math.sin(stateRef.current.pulse * 2) * 4;
        ctx.beginPath();
        // Horizontal
        ctx.moveTo(siriusX - spikeLen, siriusY);
        ctx.lineTo(siriusX + spikeLen, siriusY);
        // Vertical
        ctx.moveTo(siriusX, siriusY - spikeLen);
        ctx.lineTo(siriusX, siriusY + spikeLen);
        // Diagonal subtler spikes
        const diagLen = spikeLen * 0.6;
        ctx.moveTo(siriusX - diagLen, siriusY - diagLen);
        ctx.lineTo(siriusX + diagLen, siriusY + diagLen);
        ctx.moveTo(siriusX - diagLen, siriusY + diagLen);
        ctx.lineTo(siriusX + diagLen, siriusY - diagLen);
        ctx.stroke();
      }

      // Sirius Label
      ctx.fillStyle = '#88ccff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SIRIUS (AS-SHI\'RA)', siriusX + 16, siriusY - 8);
      ctx.fillStyle = '#00ffaa';
      ctx.font = '8px monospace';
      ctx.fillText('LORD OF SIRIUS [53:49]', siriusX + 16, siriusY + 2);
      ctx.fillStyle = '#aaddff';
      ctx.fillText('MAG -1.46 | α-CMa', siriusX + 16, siriusY + 12);
      ctx.restore();

      // 10. ANTARES BEACON (Alpha Scorpii / Qalb al-Aqrab)
      const antaresAngle = siriusAngle + Math.PI; // Opposite Sirius
      const antaresX = Math.cos(antaresAngle) * R_SIRIUS;
      const antaresY = Math.sin(antaresAngle) * R_SIRIUS;

      ctx.save();
      const aHaloGrad = ctx.createRadialGradient(
        antaresX,
        antaresY,
        0,
        antaresX,
        antaresY,
        25
      );
      aHaloGrad.addColorStop(0, '#ff4444');
      aHaloGrad.addColorStop(0.4, 'rgba(255, 68, 68, 0.3)');
      aHaloGrad.addColorStop(1, 'rgba(255, 68, 68, 0)');
      ctx.fillStyle = aHaloGrad;
      ctx.beginPath();
      ctx.arc(antaresX, antaresY, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff6666';
      ctx.beginPath();
      ctx.arc(antaresX, antaresY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff8888';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ANTARES (QALB AL-AQRAB)', antaresX + 14, antaresY - 4);
      ctx.fillStyle = '#ffaaaa';
      ctx.font = '8px monospace';
      ctx.fillText('REAR-SPOUT NAV | MAG +1.06', antaresX + 14, antaresY + 6);
      ctx.restore();

      // 11. Sanctuary Anchor: THE KA'ABA (Surah Al-Baqarah 2:127)
      if (layers.showSanctuary) {
        ctx.save();
        // Pulsing Sanctuary Aura
        const sanctPulse = Math.sin(stateRef.current.pulse) * 4;
        const sanctGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 24 + sanctPulse);
        sanctGrad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
        sanctGrad.addColorStop(0.7, 'rgba(184, 115, 51, 0.2)');
        sanctGrad.addColorStop(1, 'rgba(184, 115, 51, 0)');
        ctx.fillStyle = sanctGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 24 + sanctPulse, 0, Math.PI * 2);
        ctx.fill();

        // Ka'aba Cube Representation (Isometric square centered at 0,0)
        const cubeSize = 14;
        ctx.fillStyle = '#111111';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.8;
        ctx.fillRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);
        ctx.strokeRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);

        // Golden Kiswa Inscription Band
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-cubeSize / 2, -cubeSize / 4, cubeSize, 2.5);

        // Mizab al-Rahmah indicator on top-left edge
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-cubeSize / 2 + 2, -cubeSize / 2 + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Sanctuary Center Label
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SANCTUARY (KA\'ABA)', 0, -cubeSize - 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('FOUNDATION OF HOUSE [2:127]', 0, cubeSize + 11);

        // Safa and Marwa Landmarks (Surah Al-Baqarah 2:158)
        // Safa at (+30, -35), Marwa at (+30, +35)
        const safaX = 35;
        const safaY = -40;
        const marwaX = 35;
        const marwaY = 40;

        // Sa'i traversal path vector between Safa & Marwa
        ctx.beginPath();
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.moveTo(safaX, safaY);
        ctx.lineTo(marwaX, marwaY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Safa Node
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(safaX, safaY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('AS-SAFA [2:158]', safaX + 8, safaY + 2);

        // Marwa Node
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(marwaX, marwaY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('AL-MARWAH [2:158]', marwaX + 8, marwaY + 2);

        // Sa'i path label
        ctx.fillStyle = '#aaddff';
        ctx.font = '7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SA\'I CORRIDOR', safaX + 8, 0);

        ctx.restore();
      }

      // 12. Highlight Indicator if a node is selected from the table
      if (highlightedNodeId) {
        ctx.save();
        let targetX = 0;
        let targetY = 0;
        let targetLabel = '';

        if (highlightedNodeId === 'SANCTUARY_KAABA') {
          targetX = 0;
          targetY = 0;
          targetLabel = 'FOCUS: SANCTUARY KA\'ABA [2:127]';
        } else if (highlightedNodeId === 'SAFA_MARWA') {
          targetX = 35;
          targetY = 0;
          targetLabel = 'FOCUS: SAFA & MARWA [2:158]';
        } else if (highlightedNodeId === 'SIRIUS_BEACON') {
          targetX = siriusX;
          targetY = siriusY;
          targetLabel = 'FOCUS: SIRIUS (AS-SHI\'RA) [53:49]';
        } else if (highlightedNodeId === 'DAWN_DUSK_BARRIER') {
          targetX = 0;
          targetY = -120;
          targetLabel = 'FOCUS: DAWN/DUSK BARRIER [36:40]';
        } else if (highlightedNodeId === 'YUSUF_11_STARS') {
          targetX = 0;
          targetY = 285;
          targetLabel = 'FOCUS: YUSUF 11 STARS [12:4]';
        }

        // Radar target ring
        const targetPulse = (stateRef.current.pulse * 2) % (Math.PI * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 20 + targetPulse * 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(targetLabel, targetX, targetY - 32);
        ctx.restore();
      }

      ctx.restore(); // Restore pan & zoom transform

      // 13. Screen Space Overlays (Telemetry Stamp & Coordinate HUD)
      ctx.save();
      // Top Left Telemetry HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = '#4a4a4a';
      ctx.lineWidth = 1;
      ctx.fillRect(10, 10, 240, 75);
      ctx.strokeRect(10, 10, 240, 75);

      ctx.fillStyle = '#00ffaa';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MUDOS-6G CARTOGRAPHIC TELEMETRY', 18, 24);

      ctx.fillStyle = '#d1d5db';
      ctx.font = '8.5px monospace';
      ctx.fillText(`DAY OF YEAR: ${decResult.dayOfYear} / 365`, 18, 38);
      ctx.fillText(
        `SOLAR DECLINATION δ: ${decResult.declinationDeg.toFixed(3)}°`,
        18,
        50
      );
      ctx.fillText(
        `AXIAL TILT ε: ${decResult.axialTiltDeg.toFixed(4)}°`,
        18,
        62
      );
      ctx.fillText(
        `EQUATION OF TIME: ${decResult.equationOfTimeMinutes.toFixed(2)} min`,
        18,
        74
      );

      // Top Right Status HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = '#4a4a4a';
      ctx.fillRect(width - 210, 10, 200, 75);
      ctx.strokeRect(width - 210, 10, 200, 75);

      ctx.fillStyle = '#b87333';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('NAVIGATION ENGINE STATUS', width - 202, 24);

      ctx.fillStyle = '#d1d5db';
      ctx.font = '8.5px monospace';
      ctx.fillText(`ZOOM FACTOR: ${zoomScale.toFixed(2)}x`, width - 202, 38);
      ctx.fillText(`SIM SPEED: ${isPlaying ? `${simSpeed}x` : 'PAUSED'}`, width - 202, 50);
      const isDay = !barrierState.isPolarNight && Math.sin(stateRef.current.sunAngle) > 0;
      ctx.fillStyle = isDay ? '#ffaa00' : '#8844aa';
      ctx.fillText(`ZENITH: ${isDay ? 'DAYLIGHT (DAWN)' : 'NIGHT (DUSK)'}`, width - 202, 62);
      ctx.fillStyle = '#00ffaa';
      ctx.fillText(`POLAR: ${barrierState.isPolarDay ? 'DAY' : barrierState.isPolarNight ? 'NIGHT' : 'NORMAL'}`, width - 202, 74);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    dayOfYear,
    latitudeDeg,
    longitudeDeg,
    zoomScale,
    isPlaying,
    simSpeed,
    highlightedNodeId,
    layers,
  ]);

  // Periodic Telemetry Logger to parent terminal
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const decResult = calculateSolarDeclination(dayOfYear);
      const barrier = computeDawnDuskBarrier(
        latitudeDeg,
        longitudeDeg,
        decResult,
        stateRef.current.sunAngle
      );
      const stateStr =
        !barrier.isPolarNight && Math.sin(stateRef.current.sunAngle) > 0
          ? 'DAYLIGHT (DAWN PASS)'
          : 'NIGHT (DUSK PASS)';
      const msg = `Center Zenith Telemetry | Lat: ${latitudeDeg.toFixed(2)}° | Declination: ${decResult.declinationDeg.toFixed(2)}° | Tilt: ${decResult.axialTiltDeg.toFixed(2)}° | Status: ${stateStr}`;
      onLogMessage(msg);
    }, 4500);

    return () => clearInterval(interval);
  }, [dayOfYear, latitudeDeg, longitudeDeg, isPlaying, onLogMessage]);

  // Mouse pan and click interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    stateRef.current.isDragging = true;
    stateRef.current.dragStartX = e.clientX - stateRef.current.panX;
    stateRef.current.dragStartY = e.clientY - stateRef.current.panY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.isDragging) {
      stateRef.current.panX = e.clientX - stateRef.current.dragStartX;
      stateRef.current.panY = e.clientY - stateRef.current.dragStartY;
    }
  };

  const handleMouseUp = () => {
    stateRef.current.isDragging = false;
  };

  const handleResetPan = () => {
    stateRef.current.panX = 0;
    stateRef.current.panY = 0;
    onLogMessage('[VIEWPORT RESET] Pan coordinates restored to central (0,0) intersection.');
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center select-none"
    >
      <div className="relative w-full max-w-[880px] overflow-hidden rounded border-2 border-[#b87333] shadow-[0_0_15px_rgba(184,115,51,0.3)] bg-[#050505]">
        <canvas
          id="mudos-visualizer"
          ref={canvasRef}
          width={880}
          height={740}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-auto cursor-grab active:cursor-grabbing block"
          title="Drag to pan, use Boolean buttons or wheel to zoom"
        />

        {/* Quick Pan Reset Button Overlay */}
        <button
          onClick={handleResetPan}
          className="absolute bottom-3 right-3 px-2 py-1 bg-[#111111]/80 hover:bg-[#b87333] text-[#00ffaa] hover:text-black border border-[#b87333] text-[10px] font-mono rounded transition-colors"
          title="Reset pan to center anchor"
        >
          RESET PAN
        </button>

        {/* Dynamic Hover Tooltip if present */}
        {hoverInfo && (
          <div
            className="absolute pointer-events-none bg-black/90 border border-[#00ffaa] p-2 text-[10px] font-mono text-white rounded shadow-lg"
            style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 10 }}
          >
            <div className="font-bold text-[#00ffaa]">{hoverInfo.title}</div>
            <div className="text-gray-300">{hoverInfo.description}</div>
            <div className="text-[#b87333]">{hoverInfo.coords}</div>
          </div>
        )}
      </div>
    </div>
  );
};
