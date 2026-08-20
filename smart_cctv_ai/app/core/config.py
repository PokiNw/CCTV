import os
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
import yaml


@dataclass
class CameraConfig:
    id: str
    name: str
    rtsp_url: str
    transport: str = "tcp"  # "tcp" or "udp"
    resolution: str = "1920x1080"
    target_fps: int = 25
    enabled: bool = True
    is_test_source: bool = False
    zone: str = "Default Zone"
    username: Optional[str] = None
    password: Optional[str] = None

    def get_clean_rtsp_url(self) -> str:
        """Returns the RTSP URL, embedding credentials safely if supplied."""
        if self.username and self.password and "://" in self.rtsp_url:
            protocol, rest = self.rtsp_url.split("://", 1)
            # avoid duplicating if credentials already in url
            if "@" not in rest:
                return f"{protocol}://{self.username}:{self.password}@{rest}"
        return self.rtsp_url

    def get_sanitized_url(self) -> str:
        """Returns RTSP URL with masked password for display/logging."""
        if "@" in self.rtsp_url:
            parts = self.rtsp_url.split("@")
            prefix = parts[0].split("://")
            if len(prefix) > 1 and ":" in prefix[1]:
                user = prefix[1].split(":")[0]
                return f"{prefix[0]}://{user}:***@{parts[1]}"
        return self.rtsp_url


@dataclass
class AppConfig:
    application_name: str = "SMART CCTV AI"
    version: str = "1.0.0-phase1"
    log_level: str = "INFO"
    ui_theme: str = "dark_industrial"
    window_title: str = "SMART CCTV AI - Windows Surveillance & Analytics Dashboard"
    default_grid_layout: str = "2x2"
    reconnect_interval_sec: int = 5
    max_reconnect_attempts: int = 10
    connection_timeout_sec: int = 8
    buffer_size: int = 2
    default_fps: int = 25
    preferred_transport: str = "tcp"
    cameras: List[CameraConfig] = field(default_factory=list)
    privacy_mode: bool = True
    face_blur: bool = True


DEFAULT_CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "config",
    "config.yaml"
)


def load_config(config_path: Optional[str] = None) -> AppConfig:
    """Loads configuration from YAML file with resilient fallbacks."""
    target_path = config_path or DEFAULT_CONFIG_PATH
    if not os.path.exists(target_path):
        return AppConfig()

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            raw_data: Dict[str, Any] = yaml.safe_load(f) or {}

        app_info = raw_data.get("application", {})
        defaults = raw_data.get("camera_defaults", {})
        privacy = raw_data.get("privacy", {})

        cams_data = raw_data.get("cameras", [])
        cameras_list: List[CameraConfig] = []
        for c in cams_data:
            cameras_list.append(
                CameraConfig(
                    id=c.get("id", f"cam_{len(cameras_list)+1}"),
                    name=c.get("name", f"Camera {len(cameras_list)+1}"),
                    rtsp_url=c.get("rtsp_url", "rtsp://localhost:554/live"),
                    transport=c.get("transport", defaults.get("preferred_transport", "tcp")),
                    resolution=c.get("resolution", "1920x1080"),
                    target_fps=c.get("target_fps", defaults.get("default_fps", 25)),
                    enabled=c.get("enabled", True),
                    is_test_source=c.get("is_test_source", False),
                    zone=c.get("zone", "Default Zone"),
                    username=c.get("username"),
                    password=c.get("password"),
                )
            )

        return AppConfig(
            application_name=app_info.get("name", "SMART CCTV AI"),
            version=app_info.get("version", "1.0.0-phase1"),
            log_level=app_info.get("log_level", "INFO"),
            ui_theme=app_info.get("ui_theme", "dark_industrial"),
            window_title=app_info.get("window_title", "SMART CCTV AI - Windows Surveillance Dashboard"),
            default_grid_layout=app_info.get("default_grid_layout", "2x2"),
            reconnect_interval_sec=defaults.get("reconnect_interval_sec", 5),
            max_reconnect_attempts=defaults.get("max_reconnect_attempts", 10),
            connection_timeout_sec=defaults.get("connection_timeout_sec", 8),
            buffer_size=defaults.get("buffer_size", 2),
            default_fps=defaults.get("default_fps", 25),
            preferred_transport=defaults.get("preferred_transport", "tcp"),
            cameras=cameras_list,
            privacy_mode=privacy.get("privacy_mode", True),
            face_blur=privacy.get("face_blur", True),
        )
    except Exception as e:
        print(f"[WARN] Failed to load config from {target_path}: {e}. Using defaults.")
        return AppConfig()


def save_config(config: AppConfig, config_path: Optional[str] = None) -> bool:
    """Saves AppConfig to YAML file."""
    target_path = config_path or DEFAULT_CONFIG_PATH
    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        raw_dict = {
            "application": {
                "name": config.application_name,
                "version": config.version,
                "log_level": config.log_level,
                "ui_theme": config.ui_theme,
                "window_title": config.window_title,
                "default_grid_layout": config.default_grid_layout,
            },
            "camera_defaults": {
                "reconnect_interval_sec": config.reconnect_interval_sec,
                "max_reconnect_attempts": config.max_reconnect_attempts,
                "connection_timeout_sec": config.connection_timeout_sec,
                "buffer_size": config.buffer_size,
                "default_fps": config.default_fps,
                "preferred_transport": config.preferred_transport,
            },
            "cameras": [asdict(c) for c in config.cameras],
            "privacy": {
                "privacy_mode": config.privacy_mode,
                "face_blur": config.face_blur,
            }
        }
        with open(target_path, "w", encoding="utf-8") as f:
            yaml.dump(raw_dict, f, default_flow_style=False, sort_keys=False)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save config: {e}")
        return False
