import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bluetooth, MapPin, RefreshCw, ThermometerSun } from "lucide-react";
import "./App.css";

import type { BeaconDetection, LatLng, WeatherData } from "./types";
import { fetchCurrentWeather } from "./utils/weather";
import { getHeatRiskLevel, isAlertLevel } from "./utils/heatIndex";

import { findNearestShelter } from "./utils/distance";
import { isWebBluetoothSupported, pairWithIphoneBeacon } from "./utils/bluetooth";
import { DAEGU_SHELTERS } from "./utils/shelters";

const DAEGU_CENTER: LatLng = {
  lat: 35.8714,
  lng: 128.6014,
};

function App() {
  const [location, setLocation] = useState<LatLng>(DAEGU_CENTER);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [beacon, setBeacon] = useState<BeaconDetection | null>(null);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);

  const riskLevel = weather ? getHeatRiskLevel(weather.heatIndex) : null;

  const nearestShelter = useMemo(() => {
    return findNearestShelter(location, DAEGU_SHELTERS);
  }, [location]);

  const shouldAlert = Boolean(
    weather &&
      beacon &&
      nearestShelter &&
      isAlertLevel(weather.heatIndex)
  );

  useEffect(() => {
    setBluetoothSupported(isWebBluetoothSupported());
    requestLocation();
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [location.lat, location.lng]);

  useEffect(() => {
    if (shouldAlert) {
      setAlertOpen(true);
      speakAlert();
    }
  }, [shouldAlert]);

  async function requestLocation() {
    if (!navigator.geolocation) {
      setLocation(DAEGU_CENTER);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocation(DAEGU_CENTER);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
      }
    );
  }

  async function fetchWeather() {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      const data = await fetchCurrentWeather(location);
      setWeather(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "날씨 데이터를 불러오는 중 오류가 발생했습니다.";
      setWeatherError(message);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function startBeaconScan() {
    try {
      setBluetoothError(null);
      setScanning(true);

      const detectedBeacon = await pairWithIphoneBeacon();

      setBeacon(detectedBeacon);
      setScanning(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "비콘 연결을 시작하지 못했습니다.";

      setBluetoothError(message);
      setScanning(false);
    }
  }

  function simulateBeaconDetection() {
    setBeacon({
      id: "demo-beacon-001",
      name: "HEAT-BEACON-DEMO",
      rssi: -62,
      detectedAt: new Date(),
    });
  }

  function speakAlert() {
    if (!nearestShelter || !weather) return;

    if (!("speechSynthesis" in window)) return;

    const distance = Math.round(nearestShelter.distanceMeters);
    const text = `현재 온열질환 위험 단계입니다. 가까운 무더위쉼터는 ${nearestShelter.shelter.name}이며, 약 ${distance}미터 떨어져 있습니다. 즉시 그늘이나 쉼터로 이동하세요.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">BLE Beacon Heat Alert</p>
          <h1>노인 온열질환 예방 비콘 경고 시스템</h1>
          <p className="description">
            현재 기온·습도와 주변 비콘 감지 여부를 결합해 Heat Index가 높을 때
            가까운 무더위쉼터를 안내하는 프로토타입입니다.
          </p>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <div className="card-title">
            <MapPin size={20} />
            현재 위치
          </div>
          <p className="value">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
          <button onClick={requestLocation}>위치 다시 가져오기</button>
        </article>

        <article className="card">
          <div className="card-title">
            <ThermometerSun size={20} />
            현재 기상 상태
          </div>

          {weatherLoading && <p>날씨 데이터를 불러오는 중...</p>}
          {weatherError && <p className="error">{weatherError}</p>}

          {weather && (
            <>
              <p className="value">{weather.temperature.toFixed(1)}℃</p>
              <p>상대습도: {weather.humidity.toFixed(0)}%</p>
              <p>체감온도: {weather.apparentTemperature.toFixed(1)}℃</p>
              <p>
                Heat Index:{" "}
                <strong>{weather.heatIndex.toFixed(1)}℃</strong>
              </p>
              <p>
                위험 단계:{" "}
                <span className={`badge ${riskLevel}`}>{riskLevel}</span>
              </p>
              <p className="muted">갱신 시각: {weather.time}</p>
            </>
          )}

          <button onClick={fetchWeather}>
            <RefreshCw size={16} />
            날씨 새로고침
          </button>
        </article>

        <article className="card">
          <div className="card-title">
            <Bluetooth size={20} />
            비콘 감지
          </div>

          <p>
            Web Bluetooth 지원 여부:{" "}
            <strong>{bluetoothSupported ? "지원" : "미지원 또는 제한"}</strong>
          </p>

          <p>
            스캔 상태:{" "}
            <span className={scanning ? "ok" : "muted"}>
              {scanning ? "스캔 중" : "대기 중"}
            </span>
          </p>

          {beacon ? (
            <div className="beacon-box">
              <p>감지된 비콘: {beacon.name}</p>
              <p>RSSI: {beacon.rssi ?? "알 수 없음"}</p>
              <p>감지 시각: {beacon.detectedAt.toLocaleTimeString()}</p>
            </div>
          ) : (
            <p className="muted">아직 감지된 비콘이 없습니다.</p>
          )}

          {bluetoothError && <p className="error">{bluetoothError}</p>}

          <div className="button-row">
            <button onClick={startBeaconScan}>
              <Bluetooth size={16} />
              비콘 스캔 시작
            </button>
            <button className="secondary" onClick={simulateBeaconDetection}>
              시연용 비콘 감지
            </button>
          </div>
        </article>

        <article className="card">
          <div className="card-title">
            <AlertTriangle size={20} />
            가까운 무더위쉼터
          </div>

          {nearestShelter ? (
            <>
              <p className="value">{nearestShelter.shelter.name}</p>
              <p>{nearestShelter.shelter.address}</p>
              <p>
                현재 위치로부터 약{" "}
                <strong>{Math.round(nearestShelter.distanceMeters)}m</strong>
              </p>
            </>
          ) : (
            <p>등록된 무더위쉼터가 없습니다.</p>
          )}
        </article>
      </section>

      <section className={`status ${shouldAlert ? "danger" : ""}`}>
        {shouldAlert ? (
          <>
            <strong>경고 조건 충족</strong>
            <p>
              Heat Index가 경고 기준 이상이고, 주변 비콘이 감지되었습니다.
              가까운 무더위쉼터 안내가 필요합니다.
            </p>
          </>
        ) : (
          <>
            <strong>모니터링 중</strong>
            <p>
              날씨 데이터, 비콘 감지 여부, 무더위쉼터 위치를 계속 확인합니다.
            </p>
          </>
        )}
      </section>

      {alertOpen && shouldAlert && nearestShelter && weather && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-icon">
              <AlertTriangle size={40} />
            </div>

            <h2>온열질환 위험 경고</h2>

            <p>
              현재 Heat Index는{" "}
              <strong>{weather.heatIndex.toFixed(1)}℃</strong>로{" "}
              <strong>{riskLevel}</strong> 단계입니다.
            </p>

            <p>
              주변에서 비콘 <strong>{beacon?.name}</strong>이 감지되었습니다.
            </p>

            <div className="shelter-alert">
              <p>가까운 무더위쉼터</p>
              <h3>{nearestShelter.shelter.name}</h3>
              <p>{nearestShelter.shelter.address}</p>
              <p>
                현재 위치에서 약{" "}
                <strong>{Math.round(nearestShelter.distanceMeters)}m</strong>
              </p>
            </div>

            <p className="voice-text">
              즉시 그늘 또는 무더위쉼터로 이동하세요. 어지러움, 두통, 메스꺼움이
              있으면 주변 사람에게 도움을 요청하거나 119에 신고하세요.
            </p>

            <div className="button-row">
              <button onClick={() => setAlertOpen(false)}>확인</button>
              <button className="secondary" onClick={speakAlert}>
                음성 안내 다시 듣기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;