import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from typing import Optional

try:
    from PySide6.QtCore import QObject, Signal
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False
    class QObject:  # type: ignore
        pass


class LogSignalEmitter(QObject):
    """Bridge to emit log messages to the PySide6 UI thread safely."""
    if PYSIDE_AVAILABLE:
        log_received = Signal(str, str, str)  # timestamp, level, message
    else:
        def log_received(self, *args):  # fallback
            pass


_emitter = LogSignalEmitter()


class QtLogHandler(logging.Handler):
    """Custom logging handler forwarding log records to Qt UI signal."""
    def emit(self, record: logging.LogRecord):
        try:
            msg = self.format(record)
            timestamp = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
            level = record.levelname
            if PYSIDE_AVAILABLE and hasattr(_emitter, "log_received"):
                _emitter.log_received.emit(timestamp, level, record.getMessage())
        except Exception:
            self.handleError(record)


def setup_logger(log_level: str = "INFO", log_dir: Optional[str] = None) -> logging.Logger:
    """Configures root application logger with console, file, and UI handlers."""
    logger = logging.getLogger("SmartCCTV")
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(numeric_level)

    # Avoid duplicate handlers on re-init
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(numeric_level)
    logger.addHandler(console_handler)

    # Qt UI Handler
    qt_handler = QtLogHandler()
    qt_handler.setFormatter(formatter)
    qt_handler.setLevel(numeric_level)
    logger.addHandler(qt_handler)

    # File Handler
    if not log_dir:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        log_dir = os.path.join(base_dir, "logs")

    try:
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "cctv_system.log")
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(numeric_level)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"[WARN] Unable to create log file in {log_dir}: {e}")

    logger.info("Logger initialized successfully.")
    return logger


def get_logger(module_name: Optional[str] = None) -> logging.Logger:
    """Gets a logger instance under the SmartCCTV hierarchy."""
    if module_name:
        return logging.getLogger(f"SmartCCTV.{module_name}")
    return logging.getLogger("SmartCCTV")


def get_log_emitter() -> LogSignalEmitter:
    """Access the global Qt log signal emitter."""
    return _emitter
