import time
import os
from enum import Enum
from typing import Optional
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from PySide6.QtCore import QThread, Signal
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False
    class QThread:  # type: ignore
        def __init__(self, parent=None): pass
        def start(self): pass
        def quit(self): pass
        def wait(self): pass

from ..core.config import CameraConfig
from ..core.logger import get_logger
from .synthetic_feed import SyntheticFeedGenerator


class CameraStatus(Enum):
    OFFLINE = "OFFLINE"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    RECONNECTING = "RECONNECTING"
    ERROR = "ERROR"


class StreamWorker(QThread):
    """
    Dedicated worker thread for an individual CCTV camera feed.
    Connects to RTSP stream via OpenCV with configured transport flags (TCP/UDP).
    Falls back gracefully to synthetic video feed in test/development mode.
    Maintains real-time FPS and latency metrics, auto-reconnects on stream drops.
    """
    if PYSIDE_AVAILABLE:
        frame_ready = Signal(str, object, float, float)  # camera_id, np.ndarray frame, fps, latency_ms
        status_changed = Signal(str, str, str)            # camera_id, status_name, message
        error_occurred = Signal(str, str)                 # camera_id, error_msg
    else:
        def frame_ready(self, *args): pass
        def status_changed(self, *args): pass
        def error_occurred(self, *args): pass

    def __init__(self, camera_config: CameraConfig, reconnect_interval: int = 5, parent=None):
        super().__init__(parent)
        self.config = camera_config
        self.camera_id = camera_config.id
        self.reconnect_interval = reconnect_interval
        self.is_running = False
        self.status = CameraStatus.OFFLINE
        self.logger = get_logger(f"Worker.{self.camera_id}")
        
        # Parse resolution
        res_parts = self.config.resolution.split("x")
        self.width = int(res_parts[0]) if len(res_parts) == 2 else 1280
        self.height = int(res_parts[1]) if len(res_parts) == 2 else 720
        
        # Synthetic generator fallback
        self.synth_generator = SyntheticFeedGenerator(
            camera_name=self.config.name,
            width=self.width,
            height=self.height,
            fps=self.config.target_fps
        )

        # Performance tracking
        self.last_frame_time = time.time()
        self.frame_count = 0
        self.fps = 0.0
        self.fps_timer = time.time()
        self.reconnect_attempts = 0

    def set_status(self, new_status: CameraStatus, detail: str = ""):
        """Updates internal status and emits Qt signal."""
        self.status = new_status
        self.logger.info(f"Status changed to {new_status.value}: {detail}")
        if PYSIDE_AVAILABLE and hasattr(self, "status_changed"):
            self.status_changed.emit(self.camera_id, new_status.value, detail)

    def stop(self):
        """Stops the stream thread safely."""
        self.is_running = False
        self.logger.info(f"Stopping worker for {self.camera_id}")
        if self.isRunning():
            self.quit()
            self.wait(1500)
        self.set_status(CameraStatus.OFFLINE, "Stopped by operator")

    def run(self):
        """Main thread loop handling RTSP or Synthetic video processing."""
        self.is_running = True
        self.logger.info(f"Starting worker loop for {self.config.name} ({self.config.get_sanitized_url()})")

        while self.is_running:
            if not self.config.enabled:
                self.set_status(CameraStatus.OFFLINE, "Camera disabled")
                time.sleep(1.0)
                continue

            if self.config.is_test_source:
                self._run_synthetic_loop()
            else:
                self._run_rtsp_loop()

            if self.is_running and self.config.enabled:
                self.set_status(CameraStatus.RECONNECTING, f"Waiting {self.reconnect_interval}s before retry")
                for _ in range(self.reconnect_interval * 10):
                    if not self.is_running:
                        break
                    time.sleep(0.1)

        self.set_status(CameraStatus.OFFLINE, "Worker shutdown complete")

    def _run_synthetic_loop(self):
        """Runs the synthetic test feed generator."""
        self.set_status(CameraStatus.CONNECTED, "Synthetic CCTV feed active")
        target_interval = 1.0 / max(1, self.config.target_fps)

        while self.is_running and self.config.enabled and self.config.is_test_source:
            start = time.time()
            frame = self.synth_generator.generate_frame()
            
            self._update_fps()
            latency_ms = (time.time() - start) * 1000.0

            if PYSIDE_AVAILABLE and hasattr(self, "frame_ready"):
                self.frame_ready.emit(self.camera_id, frame, self.fps, latency_ms)

            elapsed = time.time() - start
            sleep_time = max(0.001, target_interval - elapsed)
            time.sleep(sleep_time)

    def _run_rtsp_loop(self):
        """Attempts connection to real RTSP URL using OpenCV."""
        if not CV2_AVAILABLE:
            self.set_status(CameraStatus.ERROR, "OpenCV (cv2) not available on host system")
            time.sleep(2.0)
            return

        self.set_status(CameraStatus.CONNECTING, f"Opening RTSP stream ({self.config.transport.upper()})")
        
        # Set RTSP transport environment flags if requested
        if self.config.transport.lower() == "tcp":
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
        else:
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"

        rtsp_url = self.config.get_clean_rtsp_url()
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        
        # Buffer size optimization for low-latency live monitoring
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)

        if not cap.isOpened():
            err_msg = f"Failed to connect to RTSP endpoint: {self.config.get_sanitized_url()}"
            self.logger.warning(err_msg)
            self.set_status(CameraStatus.ERROR, err_msg)
            if PYSIDE_AVAILABLE and hasattr(self, "error_occurred"):
                self.error_occurred.emit(self.camera_id, err_msg)
            cap.release()
            return

        self.set_status(CameraStatus.CONNECTED, "RTSP stream connected successfully")
        self.reconnect_attempts = 0

        while self.is_running and self.config.enabled:
            start_grab = time.time()
            ret, frame = cap.read()
            
            if not ret or frame is None:
                self.logger.warning(f"Lost video frame signal from {self.config.name}")
                self.set_status(CameraStatus.RECONNECTING, "Video frame signal lost")
                break

            self._update_fps()
            latency_ms = (time.time() - start_grab) * 1000.0

            if PYSIDE_AVAILABLE and hasattr(self, "frame_ready"):
                self.frame_ready.emit(self.camera_id, frame, self.fps, latency_ms)

            # Cap frame rate to configured target_fps
            target_interval = 1.0 / max(1, self.config.target_fps)
            elapsed = time.time() - start_grab
            if elapsed < target_interval:
                time.sleep(target_interval - elapsed)

        cap.release()

    def _update_fps(self):
        """Calculates rolling frame rate."""
        self.frame_count += 1
        now = time.time()
        duration = now - self.fps_timer
        if duration >= 1.0:
            self.fps = round(self.frame_count / duration, 1)
            self.frame_count = 0
            self.fps_timer = now
