import { SolarDeclinationResult, DawnDuskBarrierState, CartographyBase, BaseBarrierAlignment, SafaMarwaCanopyAnchor } from '../types';

export const DEG_TO_RAD = Math.PI / 180.0;
export const RAD_TO_DEG = 180.0 / Math.PI;
export const MEAN_AXIAL_TILT_DEG = 23.439291;

// Safa and Marwa Celestial Canopy Zenith Anchor (Surah Al-Baqarah 2:158)
export const SAFA_MARWA_CANOPY: SafaMarwaCanopyAnchor = {
  name: "Stellar Canopy Zenith (Safa & Marwa)",
  lat: 21.4229,
  lng: 39.8262,
  isCanopyZenithCenter: true,
  quranRef: "Surah Al-Baqarah (2:158)",
  description: "Indeed, as-Safa and al-Marwah are among the symbols of Allah (Sha'a'ir Allah). Radiant zenith canopy center anchoring celestial telemetry over the 4 global mountain bases."
};

// Configuration for the 4 Mountain Bases & Geodesic Anchors from Ibrahim's 4 Birds on 4 Hills (Quran 2:260)
export const cartographyBases: CartographyBase[] = [
  {
    id: "base_1",
    name: "Base 1: Mount Kenya",
    lat: -0.1521,
    lng: 37.3084,
    description: "East African Mountain Anchor (Equatorial Batian Peak)",
    hillName: "Mount Kenya (Batian / Nelion Ridge)",
    birdSymbol: "Eagle (Al-Uqab)",
    color: "#00ffaa",
  },
  {
    id: "base_2",
    name: "Base 2: Pico da Tijuca (Rio)",
    lat: -22.9519,
    lng: -43.2105,
    description: "South American Mountain Anchor (Atlantic Coastal Massif)",
    hillName: "Pico da Tijuca (Rio de Janeiro)",
    birdSymbol: "Falcon (Al-Bazi)",
    color: "#00ffaa",
  },
  {
    id: "base_3",
    name: "Base 3: Flattop Mountain (Anchorage)",
    lat: 61.0886,
    lng: -149.6644,
    description: "North Pacific Mountain Anchor (Chugach Range, Alaska)",
    hillName: "Flattop Mountain (Subarctic Ridge)",
    birdSymbol: "Raven (Al-Ghurab)",
    color: "#88ccff",
  },
  {
    id: "base_4",
    name: "Base 4: Mount Fuji (Japan)",
    lat: 35.3606,
    lng: 138.7274,
    description: "East Asian Mountain Anchor (Pacific Horizon, Honshu)",
    hillName: "Mount Fuji (Sacred Eastern Peak)",
    birdSymbol: "Peacock (At-Ta'us)",
    color: "#ffaa00",
  },
];

// Function to compute dawn/dusk barrier relative to the 4 bases
export function calculateTerminatorBarrier(
  timestamp: number = Date.now(),
  dayOfYear: number = 79,
  onLog?: (msg: string) => void
): BaseBarrierAlignment[] {
  const declination = calculateSolarDeclination(dayOfYear);
  const decRad = declination.declinationRad;

  const date = new Date(timestamp);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const subsolarLng = ((12 - utcHours) * 15 + declination.equationOfTimeMinutes / 4 + 540) % 360 - 180;

  return cartographyBases.map((base) => {
    // Custom projection logic for dawn/dusk alignment across the 4 nodes
    const logMsg = `Calculating barrier alignment for ${base.name} at coordinates [${base.lat}, ${base.lng}]`;
    console.log(logMsg);
    if (onLog) {
      onLog(logMsg);
    }

    const latRad = base.lat * DEG_TO_RAD;
    let localHA = (base.lng - subsolarLng) * DEG_TO_RAD;
    localHA = Math.atan2(Math.sin(localHA), Math.cos(localHA));

    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(localHA);
    const solarAltitudeDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG;

    let status: 'DAWN' | 'DAYLIGHT' | 'DUSK' | 'NIGHT';
    if (solarAltitudeDeg >= 0) {
      status = 'DAYLIGHT';
    } else if (solarAltitudeDeg >= -18) {
      status = localHA < 0 ? 'DAWN' : 'DUSK';
    } else {
      status = 'NIGHT';
    }

    // Distance to Ka'aba (Base 1)
    const kaaba = cartographyBases[0];
    const R = 6371;
    const dLat = (base.lat - kaaba.lat) * DEG_TO_RAD;
    const dLon = (base.lng - kaaba.lng) * DEG_TO_RAD;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(kaaba.lat * DEG_TO_RAD) * Math.cos(base.lat * DEG_TO_RAD) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceToKaabaKm = R * c;

    // Qibla initial bearing from base to Kaaba
    const y = Math.sin((kaaba.lng - base.lng) * DEG_TO_RAD) * Math.cos(kaaba.lat * DEG_TO_RAD);
    const x =
      Math.cos(base.lat * DEG_TO_RAD) * Math.sin(kaaba.lat * DEG_TO_RAD) -
      Math.sin(base.lat * DEG_TO_RAD) * Math.cos(kaaba.lat * DEG_TO_RAD) * Math.cos((kaaba.lng - base.lng) * DEG_TO_RAD);
    const qiblaBearingDeg = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;

    return {
      base,
      solarAltitudeDeg,
      isDaylight: solarAltitudeDeg >= 0,
      status,
      hourAngleDeg: localHA * RAD_TO_DEG,
      distanceToKaabaKm,
      qiblaBearingDeg,
    };
  });
}

/**
 * Calculates solar declination angle using Spencer's high-precision Fourier series.
 * References: Spencer (1971), Fourier series with coefficients accurate to within 0.0006 rad (< 3').
 */
export function calculateSolarDeclination(
  dayOfYear: number,
  julianCentury: number = 0.26
): SolarDeclinationResult {
  const day = Math.min(Math.max(1, Math.floor(dayOfYear)), 366);
  // Fractional day of year in radians (gamma)
  const gamma = (2.0 * Math.PI / 365.0) * (day - 1);

  // Spencer Fourier series for solar declination
  const declinationRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.001480 * Math.sin(3 * gamma);

  // Seasonal axial tilt taking into account precession / obliquity
  const seasonalAxialTilt = MEAN_AXIAL_TILT_DEG - (0.0130042 * julianCentury);

  // Equation of Time (minutes)
  const eotMinutes =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  return {
    dayOfYear: day,
    declinationRad,
    declinationDeg: declinationRad * RAD_TO_DEG,
    axialTiltDeg: seasonalAxialTilt,
    equationOfTimeMinutes: eotMinutes,
  };
}

/**
 * Computes the Dawn/Dusk barrier hour angle and unit plane vector
 * over the central cartographic intersection.
 */
export function computeDawnDuskBarrier(
  latDeg: number,
  lonDeg: number,
  declination: SolarDeclinationResult,
  localHourAngleRad: number = 0.0
): DawnDuskBarrierState {
  const latRad = latDeg * DEG_TO_RAD;
  const decRad = declination.declinationRad;

  // Cosine of the solar hour angle at dawn/dusk horizon (zenith = 90 deg)
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

  let isPolarDay = false;
  let isPolarNight = false;
  let hourAngleRad = 0;

  if (cosHourAngle <= -1.0) {
    isPolarDay = true;
    hourAngleRad = Math.PI;
  } else if (cosHourAngle >= 1.0) {
    isPolarNight = true;
    hourAngleRad = 0.0;
  } else {
    hourAngleRad = Math.acos(cosHourAngle);
  }

  const h = localHourAngleRad;
  const eastComponent = Math.cos(decRad) * Math.sin(h);
  const northComponent = Math.sin(latRad) * Math.cos(decRad) * Math.cos(h) - Math.cos(latRad) * Math.sin(decRad);
  const upComponent = Math.cos(latRad) * Math.cos(decRad) * Math.cos(h) + Math.sin(latRad) * Math.sin(decRad);

  return {
    latitudeDeg: latDeg,
    longitudeDeg: lonDeg,
    hourAngleRad,
    hourAngleDeg: hourAngleRad * RAD_TO_DEG,
    isPolarDay,
    isPolarNight,
    terminatorNormalVector: [eastComponent, northComponent, upComponent],
  };
}

/**
 * Cookie utility functions
 */
export function setCookie(name: string, value: string, days: number = 30): void {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  } catch {
    // ignore in restricted contexts
  }
}

export function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}
