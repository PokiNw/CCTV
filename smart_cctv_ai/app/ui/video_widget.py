import time
import numpy as np

try:
    from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel
    from PySide6.QtGui import QImage, QPixmap, QPainter, QColor, QFont, QPen
    from PySide6.QtCore import Qt, Signal, QRect
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False
    class QWidget:  # type: ignore
        def __init__(self, parent=None): pass


class VideoWidget(QWidget):
    """
    Renders video frames for a single CCTV camera tile with HUD overlays,
    status alerts, connection badges, FPS and latency metrics.
    Supports double-click to toggle full-screen focus.
    """
    if PYSIDE_AVAILABLE:
        double_clicked = Signal(str)  # camera_id
    else:
        def double_clicked(self, *args): pass

    def __init__(self, camera_id: str, camera_name: str, parent=None):
        super().__init__(parent)
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.status_str = "OFFLINE"
        self.status_message = "Initializing"
        self.current_pixmap: QPixmap = None
        self.fps = 0.0
        self.latency_ms = 0.0
        self.is_focused = False

        self.setMinimumSize(320, 180)
        self.setStyleSheet("background-color: #000000; border: 1px solid #1e293b; border-radius: 4px;")
        self.setMouseTracking(True)

    def update_frame(self, frame: np.ndarray, fps: float, latency_ms: float):
        """Converts raw BGR numpy frame into QPixmap and triggers repaint."""
        if not PYSIDE_AVAILABLE or frame is None:
            return

        try:
            h, w, ch = frame.shape
            bytes_per_line = ch * w
            # OpenCV BGR -> RGB
            rgb_frame = np.ascontiguousarray(frame[:, :, ::-1])
            q_img = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
            self.current_pixmap = QPixmap.fromImage(q_img)
            self.fps = fps
            self.latency_ms = latency_ms
            self.status_str = "CONNECTED"
            self.update()
        except Exception:
            pass

    def set_status(self, status_str: str, message: str = ""):
        """Sets connection status and forces redraw."""
        self.status_str = status_str
        self.status_message = message
        if status_str != "CONNECTED":
            self.current_pixmap = None
        self.update()

    def mouseDoubleClickEvent(self, event):
        """Emits double click signal to switch between single camera and multi-grid."""
        if PYSIDE_AVAILABLE and hasattr(self, "double_clicked"):
            self.double_clicked.emit(self.camera_id)
        super().mouseDoubleClickEvent(event)

    def paintEvent(self, event):
        """Paints video frame and OSD / status overlays."""
        if not PYSIDE_AVAILABLE:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        rect = self.rect()

        # Background
        painter.fillRect(rect, QColor(10, 14, 20))

        # Render Video Frame if available
        if self.current_pixmap and not self.current_pixmap.isNull():
            scaled = self.current_pixmap.scaled(
                self.size(),
                Qt.KeepAspectRatio,
                Qt.SmoothTransformation
            )
            x = (self.width() - scaled.width()) // 2
            y = (self.height() - scaled.height()) // 2
            painter.drawPixmap(x, y, scaled)
        else:
            # Standby / Status Message Canvas
            painter.setPen(QColor(100, 116, 139))
            painter.setFont(QFont("Segoe UI", 12, QFont.Bold))
            painter.drawText(rect, Qt.AlignCenter, f"[{self.status_str}]\n{self.camera_name}\n{self.status_message}")

        # Top Overlay HUD: Camera Name + Status Dot
        painter.setBrush(QColor(0, 0, 0, 160))
        painter.setPen(Qt.NoPen)
        painter.drawRoundedRect(10, 10, self.width() - 20, 32, 4, 4)

        # Status indicator color
        if self.status_str == "CONNECTED":
            dot_color = QColor(16, 185, 129)  # Green
        elif self.status_str in ("CONNECTING", "RECONNECTING"):
            dot_color = QColor(245, 158, 11)  # Yellow
        elif self.status_str == "ERROR":
            dot_color = QColor(239, 68, 68)   # Red
        else:
            dot_color = QColor(100, 116, 139) # Slate

        painter.setBrush(dot_color)
        painter.drawEllipse(22, 22, 10, 10)

        # Camera Name
        painter.setPen(QColor(241, 245, 249))
        painter.setFont(QFont("Segoe UI", 10, QFont.Bold))
        painter.drawText(40, 32, self.camera_name)

        # Metrics on right of HUD (FPS / Latency)
        if self.status_str == "CONNECTED":
            metrics_text = f"{self.fps:.1f} FPS | {int(self.latency_ms)}ms"
            painter.setPen(QColor(148, 163, 184))
            painter.setFont(QFont("Segoe UI", 9))
            metrics_rect = QRect(10, 10, self.width() - 32, 32)
            painter.drawText(metrics_rect, Qt.AlignRight | Qt.AlignVCenter, metrics_text)

        painter.end()
