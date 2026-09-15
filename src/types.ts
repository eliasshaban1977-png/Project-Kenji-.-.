export interface CleanCelestialNode {
  id: string;
  displayLabel: string;
  orbitalAngleRad: number;
  angularVelocity: number;
  radius: number;
  color: string;
  size: number;
}

export interface SolarDeclinationResult {
  dayOfYear: number;
  declinationRad: number;
  declinationDeg: number;
  axialTiltDeg: number;
  equationOfTimeMinutes: number;
}

export interface DawnDuskBarrierState {
  latitudeDeg: number;
  longitudeDeg: number;
  hourAngleRad: number;
  hourAngleDeg: number;
  isPolarDay: boolean;
  isPolarNight: boolean;
  terminatorNormalVector: [number, number, number];
}

export interface BucketMouthNav {
  frontSpoutRadius: number;
  rearSpoutRadius: number;
  siriusAntaresAngle: number;
}

export interface ScripturalReference {
  surah: string;
  ayah: string;
  theme: string;
  arabicText?: string;
  transliteration: string;
  translation: string;
  associatedNodeId?: string;
}

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type?: 'info' | 'telemetry' | 'system' | 'action';
}

export interface CartographyAnchor {
  id: string;
  name: string;
  x: number;
  y: number;
  label: string;
  type: 'anchor' | 'sanctuary' | 'landmark' | 'beacon' | 'star';
  color: string;
  description?: string;
}

export interface CartographyBase {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  hillName?: string;
  birdSymbol?: string;
  color?: string;
}

export interface BaseBarrierAlignment {
  base: CartographyBase;
  solarAltitudeDeg: number;
  isDaylight: boolean;
  status: 'DAWN' | 'DAYLIGHT' | 'DUSK' | 'NIGHT';
  hourAngleDeg: number;
  distanceToKaabaKm: number;
  qiblaBearingDeg: number;
}

export interface SafaMarwaCanopyAnchor {
  name: string;
  lat: number;
  lng: number;
  isCanopyZenithCenter: boolean;
  quranRef: string;
  description: string;
}
