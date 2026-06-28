import type { LatLng, WeatherData } from "../types";
import { calculateHeatIndexCelsius } from "./heatIndex";

type OpenMeteoResponse = {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
  };
};

export async function fetchCurrentWeather(
  location: LatLng
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lng),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature",
    timezone: "Asia/Seoul",
    forecast_days: "1",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("날씨 데이터를 불러오지 못했습니다.");
  }

  const data = (await response.json()) as OpenMeteoResponse;

  if (!data.current) {
    throw new Error("현재 날씨 데이터가 없습니다.");
  }

  const temperature = data.current.temperature_2m;
  const humidity = data.current.relative_humidity_2m;
  const apparentTemperature = data.current.apparent_temperature;
  const heatIndex = calculateHeatIndexCelsius(temperature, humidity);

  return {
    temperature,
    humidity,
    apparentTemperature,
    heatIndex,
    time: data.current.time,
  };
}