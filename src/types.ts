export type CameraStatus = "CONNECTED" | "CONNECTING" | "RECONNECTING" | "OFFLINE" | "ERROR";

export interface Camera {
  id: string;
  name: string;
  rtsp_url: string;
  transport: "tcp" | "udp";
  resolution: string;
  target_fps: number;
  enabled: boolean;
  is_test_source: boolean;
  zone: string;
  username?: string;
  password?: string;
  status: CameraStatus;
  fps: number;
  latency_ms: number;
  last_seen: string;
  useWebcam?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  source: string;
  message: string;
}

export interface SystemHealth {
  status: string;
  system_load: {
    cpu_percent: number;
    gpu_percent: number;
    ram_gb: string;
    disk_free_percent: number;
  };
  streams: {
    total: number;
    online: number;
    offline: number;
    avg_fps: number;
    buffer_status: string;
  };
  privacy_mode: boolean;
  sqlite_database: string;
  version: string;
}

export interface CodeFile {
  path: string;
  name: string;
  category: string;
}
