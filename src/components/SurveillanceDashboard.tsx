import React, { useState, useEffect } from "react";
import { Camera, CameraStatus, LogEntry, SystemHealth } from "../types";
import { CCTVCanvasTile } from "./CCTVCanvasTile";
import { CameraManagerModal } from "./CameraManagerModal";
import { LogConsole } from "./LogConsole";
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Video,
  Grid,
  Square,
  LayoutGrid,
  Shield,
  Activity,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SurveillanceDashboardProps {
  privacyMode: boolean;
}

export const SurveillanceDashboard: React.FC<SurveillanceDashboardProps> = ({ privacyMode }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState<"1x1" | "2x2" | "3x3">("2x2");
  const [selectedSidebarCamId, setSelectedSidebarCamId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      const [camsRes, logsRes, healthRes] = await Promise.all([
        fetch("/api/cameras"),
        fetch("/api/logs"),
        fetch("/api/health"),
      ]);
      const camsData = await camsRes.json();
      const logsData = await logsRes.json();
      const healthData = await healthRes.json();

      setCameras(camsData.cameras || []);
      setLogs(logsData.logs || []);
      setHealth(healthData);

      if (camsData.cameras?.length > 0 && !selectedSidebarCamId) {
        setSelectedSidebarCamId(camsData.cameras[0].id);
      }
    } catch (e) {
      console.error("Failed to load CCTV data:", e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetch("/api/health")
        .then((res) => res.json())
        .then((data) => setHealth(data))
        .catch((err) => console.error(err));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFocus = (id: string) => {
    if (focusedCameraId === id) {
      setFocusedCameraId(null);
    } else {
      setFocusedCameraId(id);
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/cameras/${id}/reconnect`, { method: "POST" });
      const data = await res.json();
      if (data.camera) {
        setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, status: "RECONNECTING" } : c)));
        setTimeout(() => {
          setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, status: "CONNECTED" } : c)));
        }, 1500);
      }
      // Refresh logs
      fetch("/api/logs")
        .then((r) => r.json())
        .then((d) => setLogs(d.logs || []));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCamera = async (cameraData: Partial<Camera>) => {
    try {
      if (editingCamera) {
        // Edit existing
        const res = await fetch(`/api/cameras/${editingCamera.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cameraData),
        });
        const data = await res.json();
        setCameras((prev) => prev.map((c) => (c.id === editingCamera.id ? data.camera : c)));
      } else {
        // Add new
        const res = await fetch("/api/cameras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cameraData),
        });
        const data = await res.json();
        setCameras((prev) => [...prev, data.camera]);
      }
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCamera = async (id: string) => {
    if (!confirm(`Are you sure you want to remove camera '${id}'?`)) return;
    try {
      await fetch(`/api/cameras/${id}`, { method: "DELETE" });
      setCameras((prev) => prev.filter((c) => c.id !== id));
      if (focusedCameraId === id) setFocusedCameraId(null);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch("/api/logs/clear", { method: "POST" });
      setLogs([]);
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = () => {
    setEditingCamera(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cam: Camera) => {
    setEditingCamera(cam);
    setIsModalOpen(true);
  };

  // Determine grid columns
  const getGridColsClass = () => {
    if (focusedCameraId) return "grid-cols-1";
    if (gridMode === "1x1") return "grid-cols-1";
    if (gridMode === "3x3") return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 lg:grid-cols-2"; // 2x2 default
  };

  const displayedCameras = focusedCameraId
    ? cameras.filter((c) => c.id === focusedCameraId)
    : cameras;

  const onlineCount = cameras.filter((c) => c.status === "CONNECTED").length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Bento Layout & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e0e13] border border-zinc-800/90 px-4 py-2.5 rounded-2xl text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Video className="w-3.5 h-3.5" />
            </span>
            <span className="tracking-tight">Multi-Channel Surveillance Grid</span>
          </div>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 font-mono text-[11px] bg-zinc-900/90 px-2 py-0.5 rounded-md border border-zinc-800">
            <span className="text-emerald-400 font-semibold">{onlineCount}</span> / {cameras.length} Active Streams
          </span>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 bg-[#15151c] p-1 rounded-xl border border-zinc-800/90">
          <span className="text-[11px] text-zinc-400 px-2 font-medium">Grid:</span>
          <button
            id="btn-grid-1x1"
            onClick={() => {
              setFocusedCameraId(null);
              setGridMode("1x1");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-150 ${
              gridMode === "1x1" && !focusedCameraId
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            1x1
          </button>
          <button
            id="btn-grid-2x2"
            onClick={() => {
              setFocusedCameraId(null);
              setGridMode("2x2");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-150 ${
              gridMode === "2x2" && !focusedCameraId
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            2x2
          </button>
          <button
            id="btn-grid-3x3"
            onClick={() => {
              setFocusedCameraId(null);
              setGridMode("3x3");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-150 ${
              gridMode === "3x3" && !focusedCameraId
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            }`}
          >
            3x3
          </button>
        </div>
      </div>

      {/* Main Bento Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[560px]">
        {/* Left Sidebar: Camera List (Col 1-3) */}
        <div className="xl:col-span-3 bg-[#0e0e13] border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              CHANNELS ({cameras.length})
            </span>
            <button
              id="btn-add-camera-sidebar"
              onClick={openAddModal}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 border border-zinc-700/60 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              Add Stream
            </button>
          </div>

          {/* Camera List Items */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {cameras.map((cam) => {
              const isSelected = selectedSidebarCamId === cam.id;
              return (
                <div
                  key={cam.id}
                  onClick={() => setSelectedSidebarCamId(cam.id)}
                  onDoubleClick={() => handleToggleFocus(cam.id)}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col space-y-2 ${
                    isSelected
                      ? "bg-[#161620] border-sky-500/50 shadow-md ring-1 ring-sky-500/20"
                      : "bg-[#111116] border-zinc-800/80 hover:border-zinc-700/80 hover:bg-[#14141a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cam.status === "CONNECTED"
                            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                            : cam.status === "RECONNECTING"
                            ? "bg-amber-400 animate-pulse"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="font-semibold text-xs text-zinc-100 truncate max-w-[130px]">
                        {cam.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                      {cam.target_fps} FPS
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{cam.zone}</span>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">{cam.transport}</span>
                  </div>

                  {/* Actions on active selected card */}
                  {isSelected && (
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-800/70 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReconnect(cam.id);
                        }}
                        title="Reconnect Stream"
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(cam);
                        }}
                        title="Edit Camera"
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCamera(cam.id);
                        }}
                        title="Remove Camera"
                        className="p-1.5 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* System Health Bento Card in Sidebar */}
          <div className="bg-[#121217] border border-zinc-800/80 p-3 rounded-xl space-y-2.5 text-xs shadow-inner">
            <div className="flex items-center justify-between text-zinc-300 font-semibold pb-1.5 border-b border-zinc-800/60">
              <span className="flex items-center gap-1.5 text-zinc-200">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Pipeline Engine
              </span>
              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                OPTIMAL
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-400 font-mono">
              <div className="flex justify-between items-center">
                <span>CPU Load:</span>
                <span className="text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {health?.system_load.cpu_percent || 22}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>RAM Allocation:</span>
                <span className="text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {health?.system_load.ram_gb || "3.8 GB"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Ring Buffer:</span>
                <span className="text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {health?.streams.buffer_status || "Healthy"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database WAL:</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  SQLite Sync
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Video Tiles Grid (Col 4-12) */}
        <div className="xl:col-span-9 flex flex-col space-y-4">
          <div className={`grid gap-4 flex-1 ${getGridColsClass()}`}>
            {displayedCameras.map((cam) => (
              <CCTVCanvasTile
                key={cam.id}
                camera={cam}
                isFocused={focusedCameraId === cam.id}
                onToggleFocus={handleToggleFocus}
                onReconnect={handleReconnect}
                privacyMode={privacyMode}
              />
            ))}
          </div>

          {/* Bottom Event Log Drawer */}
          <div className="h-44">
            <LogConsole logs={logs} onClear={handleClearLogs} />
          </div>
        </div>
      </div>

      {/* Modal */}
      <CameraManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCamera}
        initialData={editingCamera}
      />
    </div>
  );
};
