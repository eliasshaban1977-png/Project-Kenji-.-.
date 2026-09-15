import React, { useEffect, useState, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Crosshair, Sun, Moon, MapPin, Navigation, Info, Layers, Compass } from 'lucide-react';
import { VectorCartographicMap } from './VectorCartographicMap';

export interface SanctuaryMapPoint {
  id: string;
  title: string;
  category: 'sanctuary' | 'landmark' | 'anchor';
  lat: number;
  lng: number;
  quranRef?: string;
  description: string;
  color: string;
  glyphColor: string;
}

export interface GoogleMapProps {
  latitudeDeg: number;
  longitudeDeg: number;
  zoom?: number;
  mapTypeId?: 'satellite' | 'hybrid' | 'terrain' | 'roadmap';
  opacity?: number;
  centerOverride?: { lat: number; lng: number } | null;
  sanctuaryPoints?: SanctuaryMapPoint[];
  selectedPoint?: SanctuaryMapPoint | null;
  onSelectPoint?: (pt: SanctuaryMapPoint | null) => void;
  subsolarLat?: number;
  subsolarLng?: number;
  sublunarLat?: number;
  sublunarLng?: number;
  qiblaBearingDeg?: number;
  qiblaDistanceKm?: number;
  solarDeclinationDeg?: number;
  showCelestialProjections?: boolean;
  onLogMessage: (msg: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Camera controller to dynamically pan and recenter when observer coordinates update
function MapCameraController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
  }, [map, center.lat, center.lng]);

  useEffect(() => {
    if (!map) return;
    map.setZoom(zoom);
  }, [map, zoom]);

  return null;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  latitudeDeg,
  longitudeDeg,
  zoom = 13,
  mapTypeId = 'satellite',
  opacity = 1.0,
  centerOverride = null,
  sanctuaryPoints = [],
  selectedPoint = null,
  onSelectPoint,
  subsolarLat = 0,
  subsolarLng = 0,
  sublunarLat = 0,
  sublunarLng = 0,
  qiblaBearingDeg = 0,
  qiblaDistanceKm = 0,
  solarDeclinationDeg = 0,
  showCelestialProjections = true,
  onLogMessage,
  className = '',
  style = {},
}) => {
  const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [apiKeyOverride, setApiKeyOverride] = useState<string>('');
  const activeApiKey = apiKeyOverride || envApiKey;
  const [hasAuthError, setHasAuthError] = useState<boolean>(false);
  const [showObserverInfoWindow, setShowObserverInfoWindow] = useState<boolean>(false);

  const effectiveCenter = useMemo(() => {
    if (centerOverride) return centerOverride;
    return { lat: latitudeDeg, lng: longitudeDeg };
  }, [centerOverride, latitudeDeg, longitudeDeg]);

  // Intercept Google Maps Auth failures gracefully (ApiProjectMapError)
  useEffect(() => {
    const handleAuthFailure = () => {
      setHasAuthError(true);
      onLogMessage('[MAP NOTICE] Google Maps API authentication/project error (ApiProjectMapError). Satellite layer displaying high-precision vector cartography.');
    };
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = handleAuthFailure;
    return () => {
      if ((window as unknown as { gm_authFailure?: () => void }).gm_authFailure === handleAuthFailure) {
        delete (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
      }
    };
  }, [onLogMessage]);

  const hasValidApiKey = Boolean(activeApiKey && activeApiKey.trim().length > 0 && !hasAuthError);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        opacity,
        transition: 'opacity 0.3s ease-in-out',
        ...style,
      }}
    >
      {hasValidApiKey ? (
        <APIProvider
          apiKey={activeApiKey}
          onError={(err) => {
            setHasAuthError(true);
            onLogMessage(`[MAP API ERROR] ${err?.message || 'Google Maps failed to load'}. Falling back to Vector Cartography.`);
          }}
        >
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={effectiveCenter}
            defaultZoom={zoom}
            mapId="DEMO_MAP_ID"
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            onClick={(e) => {
              if (e.detail.latLng) {
                const lat = e.detail.latLng.lat;
                const lng = e.detail.latLng.lng;
                onLogMessage(`[SATELLITE LAYER] Ground target inspected: Lat ${lat.toFixed(4)}°, Lng ${lng.toFixed(4)}°`);
              }
            }}
          >
            <MapCameraController center={effectiveCenter} zoom={zoom} />

            {/* 1. Observer Coordinate Pin & Reticle */}
            <AdvancedMarker
              position={{ lat: latitudeDeg, lng: longitudeDeg }}
              onClick={() => setShowObserverInfoWindow(true)}
              title={`Observer Coordinates: ${latitudeDeg.toFixed(4)}° N, ${longitudeDeg.toFixed(4)}° E`}
            >
              <div className="relative flex items-center justify-center p-1 bg-[#00ffaa]/20 border-2 border-[#00ffaa] rounded-full shadow-[0_0_15px_#00ffaa] cursor-pointer">
                <Crosshair size={18} className="text-[#00ffaa] animate-pulse" />
                <span className="absolute -bottom-5 bg-black/90 px-1.5 py-0.5 text-[8px] font-mono text-[#00ffaa] whitespace-nowrap rounded border border-[#00ffaa]/40">
                  OBSERVER ({latitudeDeg.toFixed(2)}°, {longitudeDeg.toFixed(2)}°)
                </span>
              </div>
            </AdvancedMarker>

            {/* Observer Telemetry InfoWindow */}
            {showObserverInfoWindow && (
              <InfoWindow
                position={{ lat: latitudeDeg, lng: longitudeDeg }}
                onCloseClick={() => setShowObserverInfoWindow(false)}
                maxWidth={300}
              >
                <div className="p-1 text-black font-sans">
                  <div className="text-[12px] font-bold text-[#008060] border-b pb-1 flex items-center gap-1">
                    <Crosshair size={13} />
                    <span>Observer Position Telemetry</span>
                  </div>
                  <div className="text-[10px] text-gray-700 mt-1 font-mono space-y-0.5">
                    <div>Latitude: <strong>{latitudeDeg.toFixed(4)}° N</strong></div>
                    <div>Longitude: <strong>{longitudeDeg.toFixed(4)}° E</strong></div>
                    <div>Qibla Bearing: <strong className="text-[#8a4b08]">{qiblaBearingDeg.toFixed(1)}°</strong></div>
                    <div>Distance to Ka'aba: <strong>{qiblaDistanceKm.toFixed(0)} km</strong></div>
                    <div>Solar Declination: <strong>{solarDeclinationDeg.toFixed(2)}°</strong></div>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* 2. Sanctuary & Anchors Markers */}
            {sanctuaryPoints.map((pt) => {
              const isSelected = selectedPoint?.id === pt.id;
              return (
                <AdvancedMarker
                  key={pt.id}
                  position={{ lat: pt.lat, lng: pt.lng }}
                  onClick={() => {
                    onSelectPoint?.(pt);
                    onLogMessage(`[SANCTUARY POI] ${pt.title} | ${pt.description}`);
                  }}
                  title={pt.title}
                >
                  <Pin
                    background={pt.color}
                    borderColor={isSelected ? '#ffffff' : '#000000'}
                    glyphColor={pt.glyphColor}
                    scale={isSelected ? 1.3 : pt.category === 'sanctuary' ? 1.25 : 0.95}
                  />
                </AdvancedMarker>
              );
            })}

            {/* 3. Sub-solar Point Projection */}
            {showCelestialProjections && (
              <AdvancedMarker
                position={{ lat: subsolarLat, lng: subsolarLng }}
                onClick={() => {
                  onLogMessage(`[SUBSOLAR POINT] Lat: ${subsolarLat.toFixed(2)}° | Lng: ${subsolarLng.toFixed(2)}°`);
                }}
                title="Sub-solar Point (Solar Zenith Nadir)"
              >
                <div className="relative flex items-center justify-center p-1 bg-[#ffaa00]/25 border border-[#ffaa00] rounded-full shadow-[0_0_12px_#ffaa00] cursor-pointer">
                  <Sun size={17} className="text-[#ffff00] animate-pulse" />
                  <span className="absolute -bottom-4 bg-black/90 px-1 py-0.2 text-[8px] font-mono text-[#ffaa00] whitespace-nowrap rounded">
                    SOL NADIR ({subsolarLat.toFixed(1)}°)
                  </span>
                </div>
              </AdvancedMarker>
            )}

            {/* 4. Sub-lunar Point Projection */}
            {showCelestialProjections && (
              <AdvancedMarker
                position={{ lat: sublunarLat, lng: sublunarLng }}
                onClick={() => {
                  onLogMessage(`[SUBLUNAR POINT] Lat: ${sublunarLat.toFixed(2)}° | Lng: ${sublunarLng.toFixed(2)}°`);
                }}
                title="Sub-lunar Point (Moon Zenith Nadir)"
              >
                <div className="relative flex items-center justify-center p-1 bg-[#88ccff]/25 border border-[#88ccff] rounded-full shadow-[0_0_10px_#88ccff] cursor-pointer">
                  <Moon size={15} className="text-[#aaddff]" />
                  <span className="absolute -bottom-4 bg-black/90 px-1 py-0.2 text-[8px] font-mono text-[#88ccff] whitespace-nowrap rounded">
                    LUNA ({sublunarLat.toFixed(1)}°)
                  </span>
                </div>
              </AdvancedMarker>
            )}

            {/* Selected Landmark InfoWindow */}
            {selectedPoint && (
              <InfoWindow
                position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
                onCloseClick={() => onSelectPoint?.(null)}
                maxWidth={280}
              >
                <div className="p-1 text-black font-sans">
                  <div className="text-[12px] font-bold text-[#8a4b08] border-b pb-1">
                    {selectedPoint.title}
                  </div>
                  {selectedPoint.quranRef && (
                    <div className="text-[10px] text-[#008060] font-semibold mt-1">
                      {selectedPoint.quranRef}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-700 mt-1 leading-tight">
                    {selectedPoint.description}
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono mt-1 pt-1 border-t">
                    Lat: {selectedPoint.lat.toFixed(4)}° | Lng: {selectedPoint.lng.toFixed(4)}°
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      ) : (
        <VectorCartographicMap
          latitudeDeg={latitudeDeg}
          longitudeDeg={longitudeDeg}
          subsolarLat={subsolarLat}
          subsolarLng={subsolarLng}
          sublunarLat={sublunarLat}
          sublunarLng={sublunarLng}
          qiblaBearingDeg={qiblaBearingDeg}
          qiblaDistanceKm={qiblaDistanceKm}
          sanctuaryPoints={sanctuaryPoints}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint || (() => {})}
          showCelestialProjections={showCelestialProjections}
          onLogMessage={onLogMessage}
          onApplyApiKey={(key) => {
            setApiKeyOverride(key);
            setHasAuthError(false);
            onLogMessage('[GOOGLE MAPS] Custom API Key configured. Loading live satellite imagery layer.');
          }}
          hasAuthError={hasAuthError}
        />
      )}

      {/* Floating Observer Geodesic HUD */}
      <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-sm border border-[#b87333] rounded p-2.5 text-[10px] font-mono text-gray-300 max-w-[250px] pointer-events-auto shadow-lg z-10">
        <div className="text-[#00ffaa] font-bold text-[10px] flex items-center gap-1 border-b border-gray-700 pb-1 mb-1.5">
          <Navigation size={12} />
          <span>SATELLITE OBSERVER HUD</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Observer Lat:</span>
            <span className="text-white font-bold">{latitudeDeg.toFixed(4)}° N</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Observer Lng:</span>
            <span className="text-white font-bold">{longitudeDeg.toFixed(4)}° E</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Qibla Heading:</span>
            <span className="text-[#00ffaa] font-bold">{qiblaBearingDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Range to Ka'aba:</span>
            <span className="text-[#ffaa00] font-bold">{qiblaDistanceKm.toFixed(0)} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Solar Declination:</span>
            <span className="text-[#88ccff]">
              {solarDeclinationDeg > 0 ? `+${solarDeclinationDeg.toFixed(2)}°` : `${solarDeclinationDeg.toFixed(2)}°`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
