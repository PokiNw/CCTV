from typing import Optional

try:
    from PySide6.QtWidgets import (
        QDialog, QVBoxLayout, QHBoxLayout, QFormLayout,
        QLineEdit, QComboBox, QSpinBox, QCheckBox,
        QPushButton, QLabel, QMessageBox, QGroupBox
    )
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False
    class QDialog:  # type: ignore
        def __init__(self, parent=None): pass

from ..core.config import CameraConfig


class CameraConfigDialog(QDialog):
    """
    Configuration dialog to add or edit an RTSP / test CCTV camera source.
    Safely handles RTSP credentials without leaking or hardcoding secrets.
    """
    def __init__(self, camera_config: Optional[CameraConfig] = None, parent=None):
        super().__init__(parent)
        self.camera_config = camera_config
        self.result_config: Optional[CameraConfig] = None
        self.setWindowTitle("Camera Configuration - SMART CCTV AI")
        self.setFixedSize(520, 480)
        self._init_ui()

    def _init_ui(self):
        if not PYSIDE_AVAILABLE:
            return

        layout = QVBoxLayout(self)
        layout.setSpacing(16)

        # Basic Info Group
        info_group = QGroupBox("Camera Stream Settings")
        form = QFormLayout(info_group)
        form.setSpacing(10)

        self.name_edit = QLineEdit()
        self.name_edit.setPlaceholderText("e.g., Main Entrance")

        self.id_edit = QLineEdit()
        self.id_edit.setPlaceholderText("e.g., cam_entrance (unique identifier)")

        self.rtsp_edit = QLineEdit()
        self.rtsp_edit.setPlaceholderText("rtsp://192.168.1.100:554/stream1")

        self.transport_combo = QComboBox()
        self.transport_combo.addItems(["tcp", "udp"])

        self.res_combo = QComboBox()
        self.res_combo.addItems(["1920x1080", "1280x720", "640x480", "2560x1440"])

        self.fps_spin = QSpinBox()
        self.fps_spin.setRange(1, 60)
        self.fps_spin.setValue(25)

        self.zone_edit = QLineEdit()
        self.zone_edit.setPlaceholderText("e.g., Lobby, Entrance, Parking")
        self.zone_edit.setText("Default Zone")

        form.addRow("Camera Name *:", self.name_edit)
        form.addRow("Camera ID *:", self.id_edit)
        form.addRow("RTSP Stream URL *:", self.rtsp_edit)
        form.addRow("Transport Protocol:", self.transport_combo)
        form.addRow("Stream Resolution:", self.res_combo)
        form.addRow("Target FPS:", self.fps_spin)
        form.addRow("Monitored Zone:", self.zone_edit)

        layout.addWidget(info_group)

        # Credentials Group
        auth_group = QGroupBox("Authentication & Testing")
        auth_form = QFormLayout(auth_group)
        auth_form.setSpacing(10)

        self.user_edit = QLineEdit()
        self.user_edit.setPlaceholderText("Optional RTSP username")

        self.pass_edit = QLineEdit()
        self.pass_edit.setEchoMode(QLineEdit.Password)
        self.pass_edit.setPlaceholderText("Optional RTSP password")

        self.test_source_check = QCheckBox("Use Synthetic CCTV Test Feed (No hardware required)")
        self.enabled_check = QCheckBox("Enable Camera Stream Immediately")
        self.enabled_check.setChecked(True)

        auth_form.addRow("RTSP Username:", self.user_edit)
        auth_form.addRow("RTSP Password:", self.pass_edit)
        auth_form.addRow("", self.test_source_check)
        auth_form.addRow("", self.enabled_check)

        layout.addWidget(auth_group)

        # Action Buttons
        btn_layout = QHBoxLayout()
        self.save_btn = QPushButton("Save Camera")
        self.save_btn.setObjectName("primaryButton")
        self.save_btn.clicked.connect(self._on_save)

        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.clicked.connect(self.reject)

        btn_layout.addStretch()
        btn_layout.addWidget(self.cancel_btn)
        btn_layout.addWidget(self.save_btn)

        layout.addLayout(btn_layout)

        # Populate if editing
        if self.camera_config:
            self.name_edit.setText(self.camera_config.name)
            self.id_edit.setText(self.camera_config.id)
            self.id_edit.setEnabled(False)  # keep ID immutable on edit
            self.rtsp_edit.setText(self.camera_config.rtsp_url)
            self.transport_combo.setCurrentText(self.camera_config.transport)
            self.res_combo.setCurrentText(self.camera_config.resolution)
            self.fps_spin.setValue(self.camera_config.target_fps)
            self.zone_edit.setText(self.camera_config.zone)
            self.test_source_check.setChecked(self.camera_config.is_test_source)
            self.enabled_check.setChecked(self.camera_config.enabled)
            if self.camera_config.username:
                self.user_edit.setText(self.camera_config.username)
            if self.camera_config.password:
                self.pass_edit.setText(self.camera_config.password)

    def _on_save(self):
        if not PYSIDE_AVAILABLE:
            return

        name = self.name_edit.text().strip()
        cam_id = self.id_edit.text().strip()
        rtsp_url = self.rtsp_edit.text().strip()

        if not name:
            QMessageBox.warning(self, "Validation Error", "Please provide a valid Camera Name.")
            return
        if not cam_id:
            QMessageBox.warning(self, "Validation Error", "Please provide a unique Camera ID.")
            return
        if not rtsp_url and not self.test_source_check.isChecked():
            QMessageBox.warning(self, "Validation Error", "Please enter an RTSP URL or enable the Synthetic Test Feed.")
            return

        self.result_config = CameraConfig(
            id=cam_id,
            name=name,
            rtsp_url=rtsp_url or "rtsp://localhost:554/live",
            transport=self.transport_combo.currentText(),
            resolution=self.res_combo.currentText(),
            target_fps=self.fps_spin.value(),
            enabled=self.enabled_check.isChecked(),
            is_test_source=self.test_source_check.isChecked(),
            zone=self.zone_edit.text().strip() or "Default Zone",
            username=self.user_edit.text().strip() or None,
            password=self.pass_edit.text().strip() or None,
        )
        self.accept()
