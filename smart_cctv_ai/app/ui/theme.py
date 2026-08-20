"""
SMART CCTV AI - Dark Industrial Theme QSS Stylesheet
Tailored for Windows 10/11 native desktop application aesthetics.
"""

DARK_INDUSTRIAL_STYLE = """
QMainWindow, QDialog {
    background-color: #0f1216;
    color: #e2e8f0;
}

QWidget {
    font-family: 'Segoe UI', 'SF Pro Text', -apple-system, sans-serif;
    font-size: 13px;
    color: #cbd5e1;
}

QGroupBox {
    border: 1px solid #1e293b;
    border-radius: 6px;
    margin-top: 20px;
    padding-top: 10px;
    font-weight: 600;
    color: #94a3b8;
}

QGroupBox::title {
    subcontrol-origin: margin;
    left: 10px;
    padding: 0 4px;
    color: #38bdf8;
}

QSplitter::handle {
    background-color: #1e293b;
}

/* Header & Status Bars */
#headerWidget {
    background-color: #0b0e12;
    border-bottom: 1px solid #1e293b;
    padding: 8px 16px;
}

#headerTitle {
    font-size: 16px;
    font-weight: bold;
    color: #f8fafc;
    letter-spacing: 0.5px;
}

#systemStatusBadge {
    background-color: #064e3b;
    color: #34d399;
    border: 1px solid #059669;
    border-radius: 4px;
    padding: 4px 10px;
    font-weight: bold;
    font-size: 11px;
}

/* Sidebar and Lists */
QListWidget {
    background-color: #13171e;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 4px;
    color: #e2e8f0;
}

QListWidget::item {
    background-color: #181f2a;
    border: 1px solid #243042;
    border-radius: 4px;
    margin-bottom: 4px;
    padding: 8px;
}

QListWidget::item:selected {
    background-color: #1e3a8a;
    border: 1px solid #3b82f6;
    color: #ffffff;
}

QListWidget::item:hover {
    background-color: #212c3d;
}

/* Buttons */
QPushButton {
    background-color: #1e293b;
    color: #f1f5f9;
    border: 1px solid #334155;
    border-radius: 4px;
    padding: 6px 14px;
    font-weight: 500;
}

QPushButton:hover {
    background-color: #334155;
    border-color: #475569;
}

QPushButton:pressed {
    background-color: #0f172a;
}

QPushButton#primaryButton {
    background-color: #0284c7;
    border-color: #0369a1;
    color: #ffffff;
    font-weight: bold;
}

QPushButton#primaryButton:hover {
    background-color: #0369a1;
}

QPushButton#dangerButton {
    background-color: #991b1b;
    border-color: #7f1d1d;
    color: #ffffff;
}

QPushButton#dangerButton:hover {
    background-color: #b91c1c;
}

/* Inputs & Form Controls */
QLineEdit, QComboBox, QSpinBox {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 4px;
    padding: 6px 10px;
    color: #f0f6fc;
}

QLineEdit:focus, QComboBox:focus, QSpinBox:focus {
    border: 1px solid #38bdf8;
    background-color: #1c2128;
}

QComboBox::drop-down {
    border: none;
    width: 24px;
}

/* Log and Event Viewer */
QTableWidget, QTreeWidget {
    background-color: #0d1117;
    border: 1px solid #21262d;
    gridline-color: #1e2530;
    color: #c9d1d9;
    selection-background-color: #1f6feb;
}

QHeaderView::section {
    background-color: #161b22;
    color: #8b949e;
    padding: 4px 8px;
    border: 1px solid #21262d;
    font-weight: bold;
    font-size: 11px;
}

QScrollBar:vertical {
    border: none;
    background: #0d1117;
    width: 8px;
    margin: 0px;
}

QScrollBar::handle:vertical {
    background: #30363d;
    min-height: 20px;
    border-radius: 4px;
}

QScrollBar::handle:vertical:hover {
    background: #484f58;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0px;
}

QStatusBar {
    background-color: #0b0e12;
    border-top: 1px solid #1e293b;
    color: #94a3b8;
    font-size: 11px;
}
"""
