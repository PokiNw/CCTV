import sys
import time
from typing import Dict, Optional

try:
    from PySide6.QtWidgets import (
        QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QSplitter, QListWidget, QListWidgetItem, QPushButton,
        QLabel, QGridLayout, QStatusBar, QMessageBox,
        QTableWidget, QTableWidgetItem, QHeaderView, QGroupBox
    )
    from PySide6.QtCore import Qt, QTimer
    from PySide6.QtGui import QIcon, QColor, QFont
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False
    class QMainWindow:  # type: ignore
        def __init__(self): pass

from ..core.config import AppConfig, CameraConfig, save_config
from ..core.logger import get_logger, get_log_emitter
from ..cameras.camera_manager import CameraManager, CameraStatus
from .video_widget import VideoWidget
from .camera_config_dialog import CameraConfigDialog


class MainWindow(QMainWindow):
    """
    Primary Windows Surveillance & Analytics Dashboard for SMART CCTV AI (Phase 1).
    Manages multi-camera video layout, real-time FPS & connection tracking,
    event logging, and system health status.
    """
    def __init__(self, app_config: AppConfig, camera_manager: CameraManager):
        super().__init__()
        self.config = app_config
        self.camera_manager = camera_manager
        self.logger = get_logger("MainWindow")
        self.video_widgets: Dict[str, VideoWidget] = {}
        self.focused_camera_id: Optional[str] = None
        self.grid_layout_mode = self.config.default_grid_layout  # "1x1", "2x2", "3x3"

        self.setWindowTitle(self.config.window_title)
        self.resize(1360, 840)
        self.setMinimumSize(1024, 680)

        if PYSIDE_AVAILABLE:
            self._init_ui()
            self._connect_signals()
            self._start_system_timer()

    def _init_ui(self):
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # 1. Top Header Bar
        main_layout.addWidget(self._create_header())

        # 2. Main Middle Workspace (Splitter: Sidebar | Video Grid | Analytics)
        workspace_splitter = QSplitter(Qt.Horizontal)
        workspace_splitter.addWidget(self._create_camera_sidebar())
        workspace_splitter.addWidget(self._create_video_grid_container())
        workspace_splitter.addWidget(self._create_analytics_panel())
        workspace_splitter.setSizes([240, 840, 280])

        # 3. Bottom Splitter (Workspace | Event Log Console)
        vertical_splitter = QSplitter(Qt.Vertical)
        vertical_splitter.addWidget(workspace_splitter)
        vertical_splitter.addWidget(self._create_log_console())
        vertical_splitter.setSizes([620, 180])

        main_layout.addWidget(vertical_splitter)

        # Status Bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("SMART CCTV AI Ready. System status: Normal.")

    def _create_header(self) -> QWidget:
        header = QWidget()
        header.setObjectName("headerWidget")
        layout = QHBoxLayout(header)
        layout.setContentsMargins(16, 8, 16, 8)

        title_label = QLabel(self.config.application_name)
        title_label.setObjectName("headerTitle")

        subtitle_label = QLabel(f"v{self.config.version} | Local Privacy Mode: ON")
        subtitle_label.setStyleSheet("color: #64748b; font-size: 11px; margin-left: 8px;")

        self.sys_status_badge = QLabel("SYSTEM: 🟢 ONLINE")
        self.sys_status_badge.setObjectName("systemStatusBadge")

        # Grid view mode switch buttons
        self.grid_1_btn = QPushButton("1x1")
        self.grid_1_btn.setFixedWidth(42)
        self.grid_1_btn.clicked.connect(lambda: self._set_grid_mode("1x1"))

        self.grid_4_btn = QPushButton("2x2")
        self.grid_4_btn.setFixedWidth(42)
        self.grid_4_btn.clicked.connect(lambda: self._set_grid_mode("2x2"))

        self.grid_9_btn = QPushButton("3x3")
        self.grid_9_btn.setFixedWidth(42)
        self.grid_9_btn.clicked.connect(lambda: self._set_grid_mode("3x3"))

        self.clock_label = QLabel("00:00:00")
        self.clock_label.setStyleSheet("color: #94a3b8; font-weight: bold; font-family: monospace;")

        layout.addWidget(title_label)
        layout.addWidget(subtitle_label)
        layout.addStretch()
        layout.addWidget(QLabel("View:"))
        layout.addWidget(self.grid_1_btn)
        layout.addWidget(self.grid_4_btn)
        layout.addWidget(self.grid_9_btn)
        layout.addSpacing(16)
        layout.addWidget(self.sys_status_badge)
        layout.addSpacing(12)
        layout.addWidget(self.clock_label)

        return header

    def _create_camera_sidebar(self) -> QWidget:
        sidebar = QWidget()
        sidebar.setStyleSheet("background-color: #0b0e12; border-right: 1px solid #1e293b;")
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(8)

        title = QLabel("CAMERAS")
        title.setStyleSheet("font-weight: bold; color: #94a3b8; font-size: 11px; letter-spacing: 1px;")
        layout.addWidget(title)

        self.camera_list_widget = QListWidget()
        self.camera_list_widget.itemDoubleClicked.connect(self._on_camera_item_double_clicked)
        layout.addWidget(self.camera_list_widget)

        # Action Buttons
        btn_layout = QGridLayout()
        self.add_cam_btn = QPushButton("+ Add Cam")
        self.add_cam_btn.setObjectName("primaryButton")
        self.add_cam_btn.clicked.connect(self._on_add_camera_clicked)

        self.edit_cam_btn = QPushButton("Edit")
        self.edit_cam_btn.clicked.connect(self._on_edit_camera_clicked)

        self.reconnect_btn = QPushButton("Reconnect")
        self.reconnect_btn.clicked.connect(self._on_reconnect_clicked)

        self.delete_cam_btn = QPushButton("Delete")
        self.delete_cam_btn.setObjectName("dangerButton")
        self.delete_cam_btn.clicked.connect(self._on_delete_camera_clicked)

        btn_layout.addWidget(self.add_cam_btn, 0, 0)
        btn_layout.addWidget(self.edit_cam_btn, 0, 1)
        btn_layout.addWidget(self.reconnect_btn, 1, 0)
        btn_layout.addWidget(self.delete_cam_btn, 1, 1)

        layout.addLayout(btn_layout)
        return sidebar

    def _create_video_grid_container(self) -> QWidget:
        self.video_container = QWidget()
        self.video_container.setStyleSheet("background-color: #000000;")
        self.grid_layout = QGridLayout(self.video_container)
        self.grid_layout.setContentsMargins(6, 6, 6, 6)
        self.grid_layout.setSpacing(6)
        return self.video_container

    def _create_analytics_panel(self) -> QWidget:
        panel = QWidget()
        panel.setStyleSheet("background-color: #0b0e12; border-left: 1px solid #1e293b;")
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        title = QLabel("SYSTEM & OCCUPANCY")
        title.setStyleSheet("font-weight: bold; color: #94a3b8; font-size: 11px; letter-spacing: 1px;")
        layout.addWidget(title)

        # Occupancy Card (Phase 1 Baseline)
        occ_group = QGroupBox("Live Metrics")
        occ_layout = QVBoxLayout(occ_group)
        self.total_cams_label = QLabel("Total Cameras: 0")
        self.online_cams_label = QLabel("Online Streams: 0")
        self.avg_fps_label = QLabel("Pipeline FPS: 0.0")
        self.people_count_label = QLabel("Current People: 0 (Phase 1 Baseline)")
        self.privacy_mode_label = QLabel("Privacy Blur: ENABLED")

        for lbl in [self.total_cams_label, self.online_cams_label, self.avg_fps_label, self.people_count_label, self.privacy_mode_label]:
            lbl.setStyleSheet("color: #cbd5e1; padding: 2px 0;")
            occ_layout.addWidget(lbl)

        layout.addWidget(occ_group)

        # System Health Card
        health_group = QGroupBox("Resource Health")
        health_layout = QVBoxLayout(health_group)
        self.cpu_label = QLabel("CPU Engine: Normal")
        self.ram_label = QLabel("Frame Buffers: Healthy (2 frames)")
        self.db_label = QLabel("Local SQLite: Ready")
        for lbl in [self.cpu_label, self.ram_label, self.db_label]:
            lbl.setStyleSheet("color: #94a3b8; padding: 2px 0;")
            health_layout.addWidget(lbl)

        layout.addWidget(health_group)
        layout.addStretch()
        return panel

    def _create_log_console(self) -> QWidget:
        console_widget = QWidget()
        console_widget.setStyleSheet("background-color: #0b0e12; border-top: 1px solid #1e293b;")
        layout = QVBoxLayout(console_widget)
        layout.setContentsMargins(10, 6, 10, 6)
        layout.setSpacing(4)

        header_layout = QHBoxLayout()
        title = QLabel("EVENT FEED & SYSTEM LOGS")
        title.setStyleSheet("font-weight: bold; color: #94a3b8; font-size: 11px;")
        
        clear_btn = QPushButton("Clear")
        clear_btn.setFixedWidth(60)
        clear_btn.clicked.connect(self._clear_logs)

        header_layout.addWidget(title)
        header_layout.addStretch()
        header_layout.addWidget(clear_btn)
        layout.addLayout(header_layout)

        self.log_table = QTableWidget(0, 3)
        self.log_table.setHorizontalHeaderLabels(["Timestamp", "Level", "Message"])
        self.log_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.log_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        self.log_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.log_table.verticalHeader().setVisible(False)
        self.log_table.setShowGrid(False)

        layout.addWidget(self.log_table)
        return console_widget

    def _connect_signals(self):
        if not PYSIDE_AVAILABLE:
            return

        # Connect Camera Manager signals
        self.camera_manager.camera_status_changed.connect(self._on_camera_status_changed)
        self.camera_manager.frame_received.connect(self._on_frame_received)
        self.camera_manager.camera_added.connect(self._on_camera_added)
        self.camera_manager.camera_removed.connect(self._on_camera_removed)

        # Connect Log Emitter
        emitter = get_log_emitter()
        if hasattr(emitter, "log_received"):
            emitter.log_received.connect(self._append_log_message)

    def _start_system_timer(self):
        self.timer = QTimer(self)
        self.timer.timeout.connect(self._on_tick)
        self.timer.start(1000)

    def _on_tick(self):
        now_str = time.strftime("%H:%M:%S")
        self.clock_label.setText(now_str)

        # Update metrics panel
        total = len(self.config.cameras)
        online = self.camera_manager.get_online_count()
        self.total_cams_label.setText(f"Total Cameras: {total}")
        self.online_cams_label.setText(f"Online Streams: {online} / {total}")
        
        # Calculate avg fps
        fps_list = [w.fps for w in self.video_widgets.values()]
        avg_fps = sum(fps_list) / max(1, len(fps_list)) if fps_list else 0.0
        self.avg_fps_label.setText(f"Pipeline FPS: {avg_fps:.1f}")

    def refresh_camera_ui(self):
        """Rebuilds the camera sidebar and video grid layout."""
        if not PYSIDE_AVAILABLE:
            return

        self.camera_list_widget.clear()

        # Clear existing video widgets from layout
        while self.grid_layout.count():
            item = self.grid_layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.setParent(None)

        # Repopulate sidebar
        for cam_cfg in self.config.cameras:
            status = self.camera_manager.get_camera_status(cam_cfg.id)
            icon_str = "🟢" if status == CameraStatus.CONNECTED else "🟡" if status == CameraStatus.RECONNECTING else "🔴"
            item_text = f"{icon_str} {cam_cfg.name} ({cam_cfg.zone})"
            item = QListWidgetItem(item_text)
            item.setData(Qt.UserRole, cam_cfg.id)
            self.camera_list_widget.addItem(item)

            if cam_cfg.id not in self.video_widgets:
                vw = VideoWidget(camera_id=cam_cfg.id, camera_name=cam_cfg.name, parent=self.video_container)
                vw.double_clicked.connect(self._toggle_camera_focus)
                self.video_widgets[cam_cfg.id] = vw

        self._arrange_video_grid()

    def _arrange_video_grid(self):
        """Arranges video widgets based on current grid mode or single-cam focus."""
        if self.focused_camera_id and self.focused_camera_id in self.video_widgets:
            # Single camera focused
            for cam_id, vw in self.video_widgets.items():
                if cam_id == self.focused_camera_id:
                    vw.show()
                    self.grid_layout.addWidget(vw, 0, 0)
                else:
                    vw.hide()
            return

        # Show all widgets in configured grid
        cols = 1 if self.grid_layout_mode == "1x1" else 2 if self.grid_layout_mode == "2x2" else 3
        idx = 0
        for cam_cfg in self.config.cameras:
            cam_id = cam_cfg.id
            if cam_id in self.video_widgets:
                vw = self.video_widgets[cam_id]
                vw.show()
                row = idx // cols
                col = idx % cols
                self.grid_layout.addWidget(vw, row, col)
                idx += 1

    def _set_grid_mode(self, mode: str):
        self.focused_camera_id = None
        self.grid_layout_mode = mode
        self._arrange_video_grid()
        self.logger.info(f"Switched view layout to {mode}")

    def _toggle_camera_focus(self, camera_id: str):
        if self.focused_camera_id == camera_id:
            self.focused_camera_id = None
            self.logger.info("Exited single camera focus view")
        else:
            self.focused_camera_id = camera_id
            self.logger.info(f"Focused camera view: {camera_id}")
        self._arrange_video_grid()

    def _on_camera_item_double_clicked(self, item: QListWidgetItem):
        cam_id = item.data(Qt.UserRole)
        self._toggle_camera_focus(cam_id)

    def _on_add_camera_clicked(self):
        dialog = CameraConfigDialog(parent=self)
        if dialog.exec():
            new_cam = dialog.result_config
            if new_cam:
                self.config.cameras.append(new_cam)
                save_config(self.config)
                self.camera_manager.add_camera(new_cam, auto_start=new_cam.enabled)
                self.refresh_camera_ui()
                self.logger.info(f"New camera configured: {new_cam.name}")

    def _on_edit_camera_clicked(self):
        current_item = self.camera_list_widget.currentItem()
        if not current_item:
            QMessageBox.information(self, "Select Camera", "Please select a camera from the list to edit.")
            return
        cam_id = current_item.data(Qt.UserRole)
        cam_cfg = next((c for c in self.config.cameras if c.id == cam_id), None)
        if not cam_cfg:
            return

        dialog = CameraConfigDialog(camera_config=cam_cfg, parent=self)
        if dialog.exec():
            updated_cam = dialog.result_config
            if updated_cam:
                # Update in config
                for i, c in enumerate(self.config.cameras):
                    if c.id == cam_id:
                        self.config.cameras[i] = updated_cam
                        break
                save_config(self.config)
                self.camera_manager.remove_camera(cam_id)
                self.camera_manager.add_camera(updated_cam, auto_start=updated_cam.enabled)
                self.refresh_camera_ui()

    def _on_reconnect_clicked(self):
        current_item = self.camera_list_widget.currentItem()
        if not current_item:
            return
        cam_id = current_item.data(Qt.UserRole)
        self.camera_manager.reconnect_camera(cam_id)

    def _on_delete_camera_clicked(self):
        current_item = self.camera_list_widget.currentItem()
        if not current_item:
            return
        cam_id = current_item.data(Qt.UserRole)
        confirm = QMessageBox.question(
            self, "Confirm Delete",
            f"Are you sure you want to remove camera '{cam_id}'?",
            QMessageBox.Yes | QMessageBox.No
        )
        if confirm == QMessageBox.Yes:
            self.config.cameras = [c for c in self.config.cameras if c.id != cam_id]
            save_config(self.config)
            self.camera_manager.remove_camera(cam_id)
            if cam_id in self.video_widgets:
                self.video_widgets.pop(cam_id)
            self.refresh_camera_ui()

    def _on_camera_added(self, cam_cfg: CameraConfig):
        self.refresh_camera_ui()

    def _on_camera_removed(self, camera_id: str):
        self.refresh_camera_ui()

    def _on_camera_status_changed(self, camera_id: str, status_name: str, message: str):
        if camera_id in self.video_widgets:
            self.video_widgets[camera_id].set_status(status_name, message)
        # Update sidebar item label
        for i in range(self.camera_list_widget.count()):
            item = self.camera_list_widget.item(i)
            if item.data(Qt.UserRole) == camera_id:
                icon_str = "🟢" if status_name == "CONNECTED" else "🟡" if status_name == "RECONNECTING" else "🔴"
                cam_cfg = next((c for c in self.config.cameras if c.id == camera_id), None)
                name = cam_cfg.name if cam_cfg else camera_id
                item.setText(f"{icon_str} {name}")
                break

    def _on_frame_received(self, camera_id: str, frame: object, fps: float, latency: float):
        if camera_id in self.video_widgets:
            self.video_widgets[camera_id].update_frame(frame, fps, latency)

    def _append_log_message(self, timestamp: str, level: str, message: str):
        if not PYSIDE_AVAILABLE:
            return
        row = self.log_table.rowCount()
        self.log_table.insertRow(row)

        item_time = QTableWidgetItem(timestamp)
        item_level = QTableWidgetItem(level)
        item_msg = QTableWidgetItem(message)

        if level == "ERROR":
            item_level.setForeground(QColor(239, 68, 68))
        elif level == "WARNING":
            item_level.setForeground(QColor(245, 158, 11))
        elif level == "INFO":
            item_level.setForeground(QColor(59, 130, 246))

        self.log_table.setItem(row, 0, item_time)
        self.log_table.setItem(row, 1, item_level)
        self.log_table.setItem(row, 2, item_msg)
        self.log_table.scrollToBottom()

        # Limit to 500 lines to avoid memory leak
        if self.log_table.rowCount() > 500:
            self.log_table.removeRow(0)

    def _clear_logs(self):
        self.log_table.setRowCount(0)

    def closeEvent(self, event):
        """Gracefully shuts down camera workers when closing the desktop window."""
        self.logger.info("Closing application. Terminating camera pipelines...")
        self.camera_manager.shutdown_all()
        super().closeEvent(event)
