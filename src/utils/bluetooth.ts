import type { BeaconDetection } from "../types";

type BluetoothDeviceLike = {
  id: string;
  name?: string;
  gatt?: {
    connect: () => Promise<{
      connected: boolean;
      disconnect: () => void;
    }>;
  };
};

type BluetoothLikeNavigator = Navigator & {
  bluetooth?: {
    requestDevice?: (options: {
      acceptAllDevices?: boolean;
      filters?: Array<{
        name?: string;
        namePrefix?: string;
      }>;
    }) => Promise<BluetoothDeviceLike>;
  };
};

export function isWebBluetoothSupported(): boolean {
  const nav = navigator as BluetoothLikeNavigator;
  return Boolean(nav.bluetooth?.requestDevice);
}

export async function pairWithIphoneBeacon(): Promise<BeaconDetection> {
  const nav = navigator as BluetoothLikeNavigator;

  if (!nav.bluetooth?.requestDevice) {
    throw new Error(
      "이 브라우저는 Web Bluetooth를 지원하지 않습니다. PC Chrome 또는 Android Chrome에서 실행하세요."
    );
  }

  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
  });

  console.log("선택된 BLE 기기:", device);

  try {
    if (device.gatt) {
      const server = await device.gatt.connect();
      console.log("GATT 연결 성공:", server.connected);
    }
  } catch (error) {
    console.warn("GATT 연결은 실패했지만, 기기 선택은 감지로 처리합니다.", error);
  }

  return {
    id: device.id,
    name: device.name ?? "이름 없는 BLE 기기",
    rssi: undefined,
    detectedAt: new Date(),
  };
}