import time
import math
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class SyntheticFeedGenerator:
    """
    Generates synthetic CCTV test video patterns for development & testing.
    Provides realistic CCTV appearance: camera name, timecode, scanlines,
    dynamic movement, and simulated security test elements without requiring
    an external camera or AI model in Phase 1.
    """
    def __init__(self, camera_name: str = "CAM 01", width: int = 1280, height: int = 720, fps: int = 25):
        self.camera_name = camera_name
        self.width = width
        self.height = height
        self.fps = fps
        self.frame_index = 0
        self.start_time = time.time()

    def generate_frame(self) -> np.ndarray:
        """Generates a synthetic CCTV BGR video frame."""
        self.frame_index += 1
        t = time.time() - self.start_time

        # Base gradient canvas (dark security room / lobby simulation)
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        
        # Subtle architectural grid / hallway perspective
        # Background wall
        frame[:, :] = (28, 32, 36)
        
        # Perspective floor
        horizon = int(self.height * 0.45)
        for y in range(horizon, self.height):
            factor = (y - horizon) / (self.height - horizon)
            shade = int(35 + factor * 25)
            frame[y, :] = (shade, shade + 2, shade + 5)

        if not CV2_AVAILABLE:
            return frame

        # Perspective lines (hallway / entrance corridor)
        cx = self.width // 2
        cv2.line(frame, (cx - 80, horizon), (0, self.height), (50, 55, 60), 2)
        cv2.line(frame, (cx + 80, horizon), (self.width, self.height), (50, 55, 60), 2)
        cv2.line(frame, (cx, horizon), (cx, self.height), (42, 46, 50), 1)

        # Entrance doorway / zone archway
        cv2.rectangle(frame, (cx - 160, horizon - 120), (cx + 160, horizon + 20), (45, 50, 58), -1)
        cv2.rectangle(frame, (cx - 160, horizon - 120), (cx + 160, horizon + 20), (70, 78, 88), 2)

        # Animated security test target (simulating moving object/visitor)
        obj_x = int(cx + math.sin(t * 0.8) * (self.width * 0.28))
        obj_y = int(horizon + 40 + (math.cos(t * 0.4) + 1.0) * 0.5 * (self.height * 0.35))
        
        # Draw moving test silhouette/target
        cv2.circle(frame, (obj_x, obj_y - 45), 18, (140, 160, 180), -1)
        cv2.rectangle(frame, (obj_x - 16, obj_y - 25), (obj_x + 16, obj_y + 40), (100, 120, 140), -1)
        
        # Target crosshair / focus indicator (Phase 1 CCTV test pattern)
        cv2.drawMarker(frame, (obj_x, obj_y), (0, 220, 180), cv2.MARKER_CROSS, 20, 1)

        # Subtle scanline noise
        scanline_y = int((self.frame_index * 4) % self.height)
        cv2.line(frame, (0, scanline_y), (self.width, scanline_y), (40, 50, 60), 1)

        # CCTV On-Screen Display (OSD) / HUD
        time_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        ms_str = f"{int((time.time() % 1) * 1000):03d}"
        full_time_str = f"{time_str}.{ms_str}"

        # Top Bar: Camera Name & REC / LIVE Indicator
        cv2.rectangle(frame, (20, 20), (self.width - 20, 65), (15, 18, 22), -1)
        cv2.rectangle(frame, (20, 20), (self.width - 20, 65), (55, 65, 75), 1)
        
        # Camera Title
        cv2.putText(frame, f"[ {self.camera_name.upper()} ]", (35, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (220, 240, 255), 2, cv2.LINE_AA)
        
        # Live indicator
        pulse = (math.sin(t * 4) + 1.0) * 0.5
        green_val = int(180 + pulse * 75)
        cv2.circle(frame, (self.width - 150, 42), 6, (0, green_val, 0), -1)
        cv2.putText(frame, "LIVE TEST", (self.width - 135, 48),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 128), 1, cv2.LINE_AA)

        # Bottom Bar: Timestamp, FPS, Resolution
        cv2.rectangle(frame, (20, self.height - 65), (self.width - 20, self.height - 20), (15, 18, 22), -1)
        cv2.rectangle(frame, (20, self.height - 65), (self.width - 20, self.height - 20), (55, 65, 75), 1)
        
        cv2.putText(frame, full_time_str, (35, self.height - 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 220, 240), 1, cv2.LINE_AA)
        
        cctv_meta = f"RES: {self.width}x{self.height} | FPS: {self.fps} | SOURCE: SYNTHETIC_FEED"
        cv2.putText(frame, cctv_meta, (self.width - 480, self.height - 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 175, 190), 1, cv2.LINE_AA)

        return frame
