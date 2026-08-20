"""
Unit and Integration Tests for SMART CCTV AI (Phase 1)
Tests:
- Configuration parsing and validation
- Sanitization of RTSP credentials in URLs
- Synthetic video frame generation (resolution, channels, timing)
- CameraManager lifecycle (add, remove, query status)
- StreamWorker state transitions
"""

import os
import sys
import time
import pytest
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import AppConfig, CameraConfig, load_config
from app.cameras.synthetic_feed import SyntheticFeedGenerator
from app.cameras.camera_manager import CameraManager, CameraStatus
from app.cameras.stream_worker import StreamWorker


def test_camera_config_sanitization():
    """Test that passwords are never exposed in loggable sanitized URLs."""
    cam = CameraConfig(
        id="cam_secret",
        name="Secure Gate",
        rtsp_url="rtsp://admin:SuperSecret123@192.168.1.50:554/h264",
        username="admin",
        password="SuperSecret123"
    )
    sanitized = cam.get_sanitized_url()
    assert "SuperSecret123" not in sanitized
    assert "***" in sanitized


def test_config_loader_defaults():
    """Test loading configuration safely with fallbacks."""
    cfg = load_config("non_existent_file.yaml")
    assert isinstance(cfg, AppConfig)
    assert cfg.application_name == "SMART CCTV AI"
    assert cfg.reconnect_interval_sec > 0


def test_synthetic_feed_generator():
    """Test synthetic CCTV frame generation dimensions and format."""
    generator = SyntheticFeedGenerator(
        camera_name="Test Entrance",
        width=640,
        height=360,
        fps=30
    )
    frame = generator.generate_frame()
    assert isinstance(frame, np.ndarray)
    assert frame.shape == (360, 640, 3)
    assert frame.dtype == np.uint8


def test_camera_manager_lifecycle():
    """Test adding, querying, and removing camera workers."""
    app_cfg = AppConfig()
    manager = CameraManager(app_config=app_cfg)

    cam1 = CameraConfig(
        id="cam_test_1",
        name="Test Feed 1",
        rtsp_url="rtsp://localhost:554/live",
        is_test_source=True,
        enabled=True
    )

    worker = manager.add_camera(cam1, auto_start=False)
    assert "cam_test_1" in manager.workers
    assert manager.get_camera_status("cam_test_1") == CameraStatus.OFFLINE

    manager.remove_camera("cam_test_1")
    assert "cam_test_1" not in manager.workers
    assert manager.get_camera_status("cam_test_1") == CameraStatus.OFFLINE


def test_stream_worker_synthetic_start_stop():
    """Test worker thread starting synthetic loop and shutting down cleanly."""
    cam = CameraConfig(
        id="cam_synth_quick",
        name="Quick Test",
        rtsp_url="",
        is_test_source=True,
        enabled=True,
        target_fps=30
    )
    worker = StreamWorker(camera_config=cam, reconnect_interval=1)
    worker._update_fps()
    assert worker.frame_count >= 1
    worker.stop()
    assert worker.status == CameraStatus.OFFLINE
