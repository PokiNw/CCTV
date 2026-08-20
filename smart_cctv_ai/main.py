#!/usr/bin/env python3
"""
SMART CCTV AI - Intelligent Video Analytics & Surveillance System
Phase 1: Windows PySide6 Dashboard, Camera Manager, RTSP/Synthetic Streams, FPS Monitoring.

Usage:
    python main.py [--config path/to/config.yaml]
"""

import sys
import os
import argparse
from dotenv import load_dotenv

# Load local environment variables if present
load_dotenv()

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import load_config
from app.core.logger import setup_logger, get_logger
from app.cameras.camera_manager import CameraManager

try:
    from PySide6.QtWidgets import QApplication
    from app.ui.main_window import MainWindow
    from app.ui.theme import DARK_INDUSTRIAL_STYLE
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False


def parse_args():
    parser = argparse.ArgumentParser(description="SMART CCTV AI - Windows Surveillance Dashboard (Phase 1)")
    parser.add_argument("--config", type=str, default=None, help="Path to config.yaml")
    return parser.parse_args()


def main():
    args = parse_args()

    # 1. Load Configuration
    config = load_config(args.config)

    # 2. Setup Logging
    logger = setup_logger(log_level=config.log_level)
    logger.info(f"Starting {config.application_name} v{config.version}")
    logger.info("Phase 1 initialization: Camera Manager, RTSP / Synthetic Video Feeds, FPS HUD.")

    if not PYSIDE_AVAILABLE:
        logger.error("PySide6 is not installed. To run the desktop GUI, install requirements via:")
        logger.error("pip install -r requirements.txt")
        sys.exit(1)

    # 3. Initialize PySide6 Application
    app = QApplication(sys.argv)
    app.setApplicationName(config.application_name)
    app.setStyleSheet(DARK_INDUSTRIAL_STYLE)

    # 4. Initialize Camera Manager & Workers
    camera_manager = CameraManager(app_config=config)

    # 5. Initialize Main Dashboard Window
    main_window = MainWindow(app_config=config, camera_manager=camera_manager)
    main_window.refresh_camera_ui()
    main_window.show()

    # 6. Start Cameras
    camera_manager.initialize_cameras()

    logger.info("Dashboard opened successfully. Entering main event loop.")
    exit_code = app.exec()
    
    # Cleanup
    camera_manager.shutdown_all()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
