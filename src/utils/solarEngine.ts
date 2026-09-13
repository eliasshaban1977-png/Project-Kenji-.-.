import { SolarDeclinationResult, DawnDuskBarrierState } from '../types';

export const DEG_TO_RAD = Math.PI / 180.0;
export const RAD_TO_DEG = 180.0 / Math.PI;
export const MEAN_AXIAL_TILT_DEG = 23.439291;

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
