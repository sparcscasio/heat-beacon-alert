export type LatLng = {
  lat: number;
  lng: number;
};

export type WeatherData = {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  heatIndex: number;
  time: string;
};

export type HeatRiskLevel = "안전" | "주의" | "경고" | "위험";

export type Shelter = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type BeaconDetection = {
  id: string;
  name: string;
  rssi?: number;
  detectedAt: Date;
};