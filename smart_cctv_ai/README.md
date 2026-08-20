# SMART CCTV AI — Windows Desktop Surveillance & Analytics System

Professional, privacy-conscious CCTV video analytics and monitoring platform built for Windows 10/11 with Python 3.12+, PySide6, OpenCV, and RTSP stream processing.

---

## 🎯 Phase 1 Overview

Phase 1 establishes the foundational video pipeline and Windows desktop user interface without requiring heavy AI models:

- **Windows PySide6 Dashboard**: Dark industrial, responsive CCTV surveillance interface with multi-grid layout (1x1, 2x2, 3x3).
- **RTSP Stream Pipeline**: Asynchronous OpenCV video capture with configurable TCP/UDP transport options.
- **Camera Manager**: Centralized lifecycle orchestrator for adding, removing, connecting, disconnecting, and auto-reconnecting camera streams.
- **Synthetic Test Feeds**: Built-in dynamic CCTV test feed generator for development and testing without physical RTSP hardware.
- **Real-Time Performance HUD**: Live FPS calculation, latency estimation, stream resolution, and connection health states (`CONNECTED 🟢`, `CONNECTING / RECONNECTING 🟡`, `OFFLINE 🔴`, `ERROR ⚠️`).
- **Camera Configuration Modal**: Safe RTSP credential management (never logging or hardcoding passwords).
- **Structured Event Logging**: Rotating file logger + live GUI log stream.
- **Local Configuration**: Flexible `config.yaml` file with environment overrides.

---

## 🏗️ Architecture

```text
+-------------------------------------------------------------+
|               SMART CCTV AI (Phase 1 Pipeline)              |
+-------------------------------------------------------------+
   CCTV Cameras (RTSP)         Synthetic Test Feed Generator
          \                                /
           \                              /
            v                            v
      +-----------------------------------------+
      |  StreamWorker (OpenCV / QThread)        |
      |  - TCP / UDP Transport                  |
      |  - Auto-Reconnect Backoff               |
      |  - FPS & Latency Counter                |
      +-----------------------------------------+
                          |
                          v
      +-----------------------------------------+
      |  CameraManager                          |
      |  - State: CONNECTED / OFFLINE / ERROR   |
      |  - Dispatcher & Health Monitor          |
      +-----------------------------------------+
                          |
                          v
      +-----------------------------------------+
      |  PySide6 Windows Desktop UI             |
      |  - VideoGrid (1x1, 2x2, 3x3)            |
      |  - Camera Manager Sidebar               |
      |  - Real-Time HUD Overlays               |
      |  - Event Feed & Console Logs            |
      +-----------------------------------------+
```

---

## 📦 Project Structure

```text
smart_cctv_ai/
├── app/
│   ├── cameras/
│   │   ├── __init__.py
│   │   ├── camera_manager.py     # Stream orchestration & lifecycle
│   │   ├── stream_worker.py      # OpenCV RTSP capture worker thread
│   │   └── synthetic_feed.py     # Mock CCTV generator for testing
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # YAML config loader & dataclasses
│   │   └── logger.py             # Rotating file log + Qt signal emitter
│   └── ui/
│       ├── __init__.py
│       ├── camera_config_dialog.py # Dialog to add/edit RTSP cameras
│       ├── main_window.py        # Main PySide6 dashboard window
│       ├── theme.py              # Windows dark industrial stylesheet
│       └── video_widget.py       # High-performance video tile & HUD
├── config/
│   └── config.yaml               # Default system configuration
├── tests/
│   ├── __init__.py
│   └── test_phase1.py            # Pytest unit & integration tests
├── .env.example                  # Environment configuration template
├── requirements.txt              # Python dependencies
├── main.py                       # Application entry point
└── README.md
```

---

## 🚀 Installation & Setup (Windows 10/11)

### 1. Prerequisites
- **Operating System**: Windows 10 or 11 (64-bit)
- **Python**: Python 3.12+ (ensure "Add python.exe to PATH" is checked during install)

### 2. Create Virtual Environment
Open PowerShell or Windows Terminal in the project directory:

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configuration
Copy `.env.example` to `.env` if you need custom credentials:
```powershell
copy .env.example .env
```

---

## ▶️ Running the Application

To launch the desktop dashboard:

```powershell
python main.py
```

To run with a custom configuration file:

```powershell
python main.py --config config/my_custom_cctv.yaml
```

---

## 🧪 Running Automated Tests

Run the test suite with `pytest`:

```powershell
pytest tests/ -v
```

---

## ⚙️ Configuration (`config/config.yaml`)

```yaml
application:
  name: "SMART CCTV AI"
  version: "1.0.0-phase1"
  log_level: "INFO"
  default_grid_layout: "2x2"

camera_defaults:
  reconnect_interval_sec: 5
  connection_timeout_sec: 8
  preferred_transport: "tcp"

cameras:
  - id: "cam_entrance"
    name: "Main Entrance"
    rtsp_url: "rtsp://192.168.1.101:554/stream1"
    transport: "tcp"
    resolution: "1920x1080"
    target_fps: 25
    enabled: true
    is_test_source: true
    zone: "Entrance"
```

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `OpenCV: FFMPEG: tag 0x... is not supported` | RTSP stream codec mismatch | Change transport from `udp` to `tcp` in camera settings. |
| Camera shows `RECONNECTING` | Camera IP unreachable or RTSP port blocked | Check camera network ping and ensure port 554 is open. |
| High CPU usage | Resolution too high or too many FPS | Lower stream resolution to 1280x720 and target FPS to 20 in camera configuration. |

---

## 🗺️ Next Phase: Phase 2 Roadmap

- **Ultralytics YOLO Integration**: Detect `person` objects with bounding boxes and confidence scores.
- **Inference Worker Pool**: Decouple model inference from video capture thread.
- **Privacy Mode Face Region Detection**: Local anonymization and face blurring.
