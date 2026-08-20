from typing import Dict, List, Optional
from ..core.config import AppConfig, CameraConfig
from ..core.logger import get_logger
from .stream_worker import StreamWorker, CameraStatus

try:
    from PySide6.QtCore import QObject, Signal
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False
    class QObject:  # type: ignore
        pass


class CameraManager(QObject):
    """
    Coordinates and monitors all active CCTV video streams.
    Provides centralized lifecycle management: add, remove, start, stop, reconnect.
    """
    if PYSIDE_AVAILABLE:
        camera_added = Signal(object)              # CameraConfig
        camera_removed = Signal(str)               # camera_id
        camera_status_changed = Signal(str, str, str)  # camera_id, status_name, message
        frame_received = Signal(str, object, float, float)  # camera_id, frame, fps, latency
    else:
        def camera_added(self, *args): pass
        def camera_removed(self, *args): pass
        def camera_status_changed(self, *args): pass
        def frame_received(self, *args): pass

    def __init__(self, app_config: AppConfig, parent=None):
        super().__init__(parent)
        self.app_config = app_config
        self.workers: Dict[str, StreamWorker] = {}
        self.logger = get_logger("CameraManager")

    def initialize_cameras(self):
        """Initializes workers for all configured cameras."""
        self.logger.info(f"Initializing {len(self.app_config.cameras)} configured cameras...")
        for cam_cfg in self.app_config.cameras:
            self.add_camera(cam_cfg, auto_start=cam_cfg.enabled)

    def add_camera(self, camera_config: CameraConfig, auto_start: bool = True) -> StreamWorker:
        """Adds and optionally starts a camera worker."""
        if camera_config.id in self.workers:
            self.logger.warning(f"Camera {camera_config.id} already exists. Updating configuration.")
            self.remove_camera(camera_config.id)

        worker = StreamWorker(
            camera_config=camera_config,
            reconnect_interval=self.app_config.reconnect_interval_sec,
            parent=self
        )

        if PYSIDE_AVAILABLE:
            worker.status_changed.connect(self._on_worker_status_changed)
            worker.frame_ready.connect(self._on_worker_frame_ready)

        self.workers[camera_config.id] = worker

        if auto_start and camera_config.enabled:
            worker.start()

        if PYSIDE_AVAILABLE and hasattr(self, "camera_added"):
            self.camera_added.emit(camera_config)

        self.logger.info(f"Camera added: {camera_config.name} (ID: {camera_config.id})")
        return worker

    def remove_camera(self, camera_id: str):
        """Stops and removes a camera worker."""
        if camera_id in self.workers:
            worker = self.workers.pop(camera_id)
            worker.stop()
            if PYSIDE_AVAILABLE and hasattr(self, "camera_removed"):
                self.camera_removed.emit(camera_id)
            self.logger.info(f"Camera removed: {camera_id}")

    def reconnect_camera(self, camera_id: str):
        """Forces a stop and restart of a camera worker."""
        if camera_id in self.workers:
            worker = self.workers[camera_id]
            self.logger.info(f"Triggering manual reconnect for {camera_id}")
            worker.stop()
            worker.start()

    def get_camera_status(self, camera_id: str) -> CameraStatus:
        """Returns the current status of a given camera."""
        if camera_id in self.workers:
            return self.workers[camera_id].status
        return CameraStatus.OFFLINE

    def get_all_statuses(self) -> Dict[str, CameraStatus]:
        """Returns dictionary of all camera statuses."""
        return {cam_id: w.status for cam_id, w in self.workers.items()}

    def get_online_count(self) -> int:
        """Returns number of currently CONNECTED cameras."""
        return sum(1 for w in self.workers.values() if w.status == CameraStatus.CONNECTED)

    def shutdown_all(self):
        """Gracefully terminates all worker threads."""
        self.logger.info("Shutting down all camera workers...")
        for cam_id, worker in list(self.workers.items()):
            worker.stop()
        self.workers.clear()

    def _on_worker_status_changed(self, camera_id: str, status_name: str, message: str):
        if PYSIDE_AVAILABLE and hasattr(self, "camera_status_changed"):
            self.camera_status_changed.emit(camera_id, status_name, message)

    def _on_worker_frame_ready(self, camera_id: str, frame: object, fps: float, latency: float):
        if PYSIDE_AVAILABLE and hasattr(self, "frame_received"):
            self.frame_received.emit(camera_id, frame, fps, latency)
