import type { HeatRiskLevel } from "../types";

export function calculateHeatIndexCelsius(
  temperatureC: number,
  relativeHumidity: number
): number {
  const t = (temperatureC * 9) / 5 + 32;
  const rh = relativeHumidity;

  const hiF =
    -42.379 +
    2.04901523 * t +
    10.14333127 * rh -
    0.22475541 * t * rh -
    0.00683783 * t * t -
    0.05481717 * rh * rh +
    0.00122874 * t * t * rh +
    0.00085282 * t * rh * rh -
    0.00000199 * t * t * rh * rh;

  return ((hiF - 32) * 5) / 9;
}

export function getHeatRiskLevel(heatIndexC: number): HeatRiskLevel {
  if (heatIndexC >= 41) return "위험";
  if (heatIndexC >= 32) return "경고";
  if (heatIndexC >= 27) return "주의";
  return "안전";
}

export function isAlertLevel(heatIndexC: number): boolean {
  return heatIndexC >= 32;
}