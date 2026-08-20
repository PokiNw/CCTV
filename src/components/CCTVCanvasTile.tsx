import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraStatus } from "../types";
import { Maximize2, Minimize2, RefreshCw, Video, VideoOff, ShieldAlert, Cpu, Activity, Camera as CameraIcon } from "lucide-react";

interface CCTVCanvasTileProps {
  camera: Camera;
  isFocused: boolean;
  onToggleFocus: (id: string) => void;
  onReconnect: (id: string) => void;
  privacyMode: boolean;
  showScanlines?: boolean;
}

export const CCTVCanvasTile: React.FC<CCTVCanvasTileProps> = ({
  camera,
  isFocused,
  onToggleFocus,
  onReconnect,
  privacyMode,
  showScanlines = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [measuredFps, setMeasuredFps] = useState<number>(camera.fps || 25);
  const [latency, setLatency] = useState<number>(camera.latency_ms || 20);

  // Webcam stream management if user enables webcam on this camera tile
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (camera.useWebcam && camera.enabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setWebcamActive(true);
            setWebcamError(null);
          }
        })
        .catch((err) => {
          console.warn("Webcam access error:", err);
          setWebcamError("Webcam permission denied or unavailable");
          setWebcamActive(false);
        });
    } else {
      setWebcamActive(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [camera.useWebcam, camera.enabled]);

  // Synthetic or Webcam CCTV Video Loop
  useEffect(() => {
    let animationFrameId: number;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let startTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;
      frameCount++;

      if (now - lastFpsUpdate >= 1000) {
        setMeasuredFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
        setLatency(Math.floor(15 + Math.random() * 8));
      }

      const width = canvas.width;
      const height = canvas.height;

      // Handle Offline or Error states
      if (!camera.enabled || camera.status === "OFFLINE") {
        ctx.fillStyle = "#090d12";
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = "#161f2c";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 16px 'Segoe UI', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`[ CAMERA OFFLINE ]`, width / 2, height / 2 - 10);
        ctx.font = "12px 'Segoe UI', monospace";
        ctx.fillText(camera.name, width / 2, height / 2 + 15);
        ctx.fillText("Stream is disabled in configuration", width / 2, height / 2 + 35);
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (camera.status === "RECONNECTING" || camera.status === "CONNECTING") {
        ctx.fillStyle = "#0c1017";
        ctx.fillRect(0, 0, width, height);

        // Animated radar sweep
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        const radius = 50;
        const cx = width / 2;
        const cy = height / 2 - 20;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const angle = t * 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 14px 'Segoe UI', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          camera.status === "RECONNECTING" ? "RECONNECTING RTSP STREAM..." : "INITIALIZING HANDSHAKE...",
          width / 2,
          height / 2 + 55
        );
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Segoe UI', monospace";
        ctx.fillText(`Target: ${camera.rtsp_url}`, width / 2, height / 2 + 75);

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Draw Webcam or Synthetic Scene
      if (webcamActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        if (privacyMode) {
          // Blur simulated face region in center of webcam
          ctx.save();
          ctx.filter = "blur(18px)";
          ctx.beginPath();
          ctx.arc(width / 2, height / 2 - 20, 60, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(videoRef.current, 0, 0, width, height);
          ctx.restore();

          // Privacy ring overlay
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2 - 20, 60, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#38bdf8";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText("PRIVACY MASK", width / 2, height / 2 + 55);
        }
      } else {
        // Synthetic Security Video Feed Simulation
        // 1. Room Background
        ctx.fillStyle = "#161b22";
        ctx.fillRect(0, 0, width, height);

        // Perspective corridor / zone walls
        const horizon = height * 0.45;
        ctx.fillStyle = "#1e2633";
        ctx.fillRect(0, 0, width, horizon);

        ctx.fillStyle = "#12171f";
        ctx.fillRect(0, horizon, width, height - horizon);

        // Hallway perspective lines
        ctx.strokeStyle = "#283447";
        ctx.lineWidth = 2;
        const cx = width / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 80, horizon);
        ctx.lineTo(0, height);
        ctx.moveTo(cx + 80, horizon);
        ctx.lineTo(width, height);
        ctx.moveTo(cx, horizon);
        ctx.lineTo(cx, height);
        ctx.stroke();

        // Architectural Doorway / Monitored Portal
        ctx.fillStyle = "#222c3c";
        ctx.fillRect(cx - 120, horizon - 90, 240, 90);
        ctx.strokeStyle = "#3b4b63";
        ctx.strokeRect(cx - 120, horizon - 90, 240, 90);

        // Synthetic Moving Test Target (Person / Visitor simulation)
        const targetX = cx + Math.sin(t * 0.7) * (width * 0.3);
        const targetY = horizon + 30 + ((Math.cos(t * 0.35) + 1) / 2) * (height * 0.38);

        // Body silhouette
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.arc(targetX, targetY - 35, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(targetX - 12, targetY - 20, 24, 34);

        // Phase 1 Anonymous Target Box / Crosshair
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(targetX - 20, targetY - 52, 40, 72);

        // Face Privacy Blurring simulation if enabled
        if (privacyMode) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.beginPath();
          ctx.arc(targetX, targetY - 35, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#38bdf8";
          ctx.font = "9px monospace";
          ctx.textAlign = "center";
          ctx.fillText("ANON", targetX, targetY - 32);
        }

        // Test marker label
        ctx.fillStyle = "#00f0ff";
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`TEST TARGET [${camera.zone}]`, targetX - 20, targetY - 58);
      }

      // 2. Scanline Effect (if enabled)
      if (showScanlines) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5);
        }

        // Moving refresh bar
        const scanY = (frameCount * 3) % height;
        ctx.fillStyle = "rgba(56, 189, 248, 0.06)";
        ctx.fillRect(0, scanY, width, 12);
      }

      // 3. Top HUD: Camera Name, Pulsing REC / LIVE
      ctx.fillStyle = "rgba(11, 14, 18, 0.85)";
      ctx.fillRect(10, 10, width - 20, 32);
      ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
      ctx.strokeRect(10, 10, width - 20, 32);

      // Status indicator dot
      ctx.beginPath();
      ctx.arc(26, 26, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      // Camera Title
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 12px 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(camera.name.toUpperCase(), 38, 30);

      // LIVE pill
      const pulseOpacity = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(239, 68, 68, ${pulseOpacity})`;
      ctx.beginPath();
      ctx.arc(width - 70, 26, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 10px monospace";
      ctx.fillText("LIVE", width - 60, 30);

      // 4. Bottom HUD: Live Timestamp, FPS, Resolution, Transport
      ctx.fillStyle = "rgba(11, 14, 18, 0.85)";
      ctx.fillRect(10, height - 38, width - 20, 28);
      ctx.strokeStyle = "rgba(51, 65, 85, 0.8)";
      ctx.strokeRect(10, height - 38, width - 20, 28);

      const d = new Date();
      const dateStr = d.toISOString().replace("T", " ").substring(0, 19);
      const msStr = String(d.getMilliseconds()).padStart(3, "0");

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${dateStr}.${msStr}`, 20, height - 20);

      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "right";
      const meta = `${camera.resolution} | ${measuredFps.toFixed(1)} FPS | ${latency}ms | ${camera.transport.toUpperCase()}`;
      ctx.fillText(meta, width - 20, height - 20);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera, webcamActive, privacyMode, showScanlines, measuredFps, latency]);

  const getStatusBadge = () => {
    switch (camera.status) {
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        );
      case "CONNECTING":
      case "RECONNECTING":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            SYNCING
          </span>
        );
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div
      id={`camera-tile-${camera.id}`}
      className={`relative group flex flex-col bg-[#0e0e13] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
        isFocused
          ? "col-span-full row-span-full h-full border-sky-500/80 shadow-2xl ring-1 ring-sky-500/30"
          : "border-zinc-800/90 hover:border-zinc-700"
      }`}
    >
      {/* Hidden video element for local webcam feed */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Main Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[220px] bg-[#070709] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain cursor-pointer"
          onDoubleClick={() => onToggleFocus(camera.id)}
        />

        {/* Hover Quick Action Toolbar */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#15151c]/90 backdrop-blur border border-zinc-700/70 rounded-xl p-1 z-20 shadow-lg">
          <button
            id={`btn-reconnect-${camera.id}`}
            onClick={() => onReconnect(camera.id)}
            title="Reconnect Stream"
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-focus-${camera.id}`}
            onClick={() => onToggleFocus(camera.id)}
            title={isFocused ? "Exit Fullscreen" : "Fullscreen View"}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            {isFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Tile Bottom Summary Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#121217] border-t border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2.5">
          {getStatusBadge()}
          <span className="text-zinc-300 font-medium truncate max-w-[140px] text-[11px]">{camera.zone}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
          <span className="text-zinc-200 font-semibold">{measuredFps.toFixed(0)} fps</span>
          <span className="text-zinc-600">•</span>
          <span>{latency} ms</span>
        </div>
      </div>
    </div>
  );
};
