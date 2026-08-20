import React, { useState, useEffect } from "react";
import { Camera } from "../types";
import { X, Video, Shield, CheckCircle, AlertTriangle, Loader2, Sparkles, Camera as CameraIcon } from "lucide-react";

interface CameraManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cameraData: Partial<Camera>) => void;
  initialData?: Camera | null;
}

export const CameraManagerModal: React.FC<CameraManagerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [transport, setTransport] = useState<"tcp" | "udp">("tcp");
  const [resolution, setResolution] = useState("1920x1080");
  const [targetFps, setTargetFps] = useState(25);
  const [zone, setZone] = useState("Main Lobby");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isTestSource, setIsTestSource] = useState(true);
  const [useWebcam, setUseWebcam] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setId(initialData.id);
      setRtspUrl(initialData.rtsp_url);
      setTransport(initialData.transport || "tcp");
      setResolution(initialData.resolution || "1920x1080");
      setTargetFps(initialData.target_fps || 25);
      setZone(initialData.zone || "Default Zone");
      setUsername(initialData.username || "");
      setPassword(initialData.password || "");
      setIsTestSource(initialData.is_test_source ?? true);
      setUseWebcam(initialData.useWebcam ?? false);
      setEnabled(initialData.enabled ?? true);
    } else {
      const uniqueId = `cam_${Date.now().toString().slice(-4)}`;
      setName("New Security Camera");
      setId(uniqueId);
      setRtspUrl("rtsp://192.168.1.120:554/stream1");
      setTransport("tcp");
      setResolution("1920x1080");
      setTargetFps(25);
      setZone("Entrance");
      setUsername("admin");
      setPassword("");
      setIsTestSource(true);
      setUseWebcam(false);
      setEnabled(true);
    }
    setTestResult(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/cameras/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rtsp_url: rtspUrl,
          transport,
          is_test_source: isTestSource,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || "Connection validated",
        latency_ms: data.latency_ms,
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || "Connection handshake timed out.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) return;

    onSave({
      id,
      name: name.trim(),
      rtsp_url: rtspUrl.trim(),
      transport,
      resolution,
      target_fps: Number(targetFps),
      zone: zone.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
      is_test_source: isTestSource,
      useWebcam,
      enabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0e0e13] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-800/80 bg-[#121217]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {initialData ? "Configure Stream Channel" : "Add Camera Stream Channel"}
              </h2>
              <p className="text-xs text-zinc-400">
                Configure RTSP transport, FPS targets, zone assignments, and synthetic modes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 flex-1 text-xs text-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Camera Display Name *</label>
              <input
                id="input-camera-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., North Perimeter Gate"
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Camera Identifier (ID) *</label>
              <input
                id="input-camera-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g., cam_north_gate"
                disabled={!!initialData}
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-zinc-100 disabled:opacity-50 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">RTSP Stream URI / Endpoint *</label>
            <input
              id="input-rtsp-url"
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://192.168.1.100:554/stream1"
              className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Transport Protocol</label>
              <select
                id="select-transport"
                value={transport}
                onChange={(e) => setTransport(e.target.value as "tcp" | "udp")}
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 text-xs"
              >
                <option value="tcp">TCP (Reliable / No Loss)</option>
                <option value="udp">UDP (Low Latency)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Resolution</label>
              <select
                id="select-resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 text-xs"
              >
                <option value="1920x1080">1080p (1920x1080)</option>
                <option value="1280x720">720p (1280x720)</option>
                <option value="2560x1440">2K (2560x1440)</option>
                <option value="640x480">VGA (640x480)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Target FPS</label>
              <input
                id="input-target-fps"
                type="number"
                min="5"
                max="60"
                value={targetFps}
                onChange={(e) => setTargetFps(Number(e.target.value))}
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Monitored Zone</label>
              <input
                id="input-zone"
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="e.g., Main Entrance"
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">RTSP Username (Optional)</label>
              <input
                id="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">RTSP Password (Optional)</label>
              <input
                id="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 text-xs"
              />
            </div>
          </div>

          {/* Test feed switches */}
          <div className="p-4 bg-[#121217] border border-zinc-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-xs text-zinc-100">Use Synthetic CCTV Feed (Development Mode)</p>
                <p className="text-[11px] text-zinc-400">Renders animated CCTV perspective and test targets without hardware.</p>
              </div>
              <input
                id="toggle-synthetic"
                type="checkbox"
                checked={isTestSource}
                onChange={(e) => setIsTestSource(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
              <div>
                <p className="font-medium text-xs text-zinc-100 flex items-center gap-1.5">
                  <CameraIcon className="w-3.5 h-3.5 text-sky-400" />
                  Connect Local Webcam to this Channel
                </p>
                <p className="text-[11px] text-zinc-400">Use your computer camera as a live physical video input.</p>
              </div>
              <input
                id="toggle-webcam"
                type="checkbox"
                checked={useWebcam}
                onChange={(e) => setUseWebcam(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
              <div>
                <p className="font-medium text-xs text-zinc-100">Stream Enabled</p>
                <p className="text-[11px] text-zinc-400">Deactivate to conserve network bandwidth and worker threads.</p>
              </div>
              <input
                id="toggle-enabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <button
              id="btn-test-connection"
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-1.5 bg-[#181822] hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-sky-400" />}
              Test RTSP Handshake
            </button>

            {testResult && (
              <div
                className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                {testResult.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>
                  {testResult.message} {testResult.latency_ms ? `(${testResult.latency_ms}ms)` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-camera"
              type="submit"
              className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              {initialData ? "Save Changes" : "Add Camera"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
