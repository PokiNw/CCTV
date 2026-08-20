import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as yaml from "js-yaml";

// Initialize Gemini client server-side
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

interface CameraItem {
  id: string;
  name: string;
  rtsp_url: string;
  transport: "tcp" | "udp";
  resolution: string;
  target_fps: number;
  enabled: boolean;
  is_test_source: boolean;
  zone: string;
  username?: string;
  status: "CONNECTED" | "CONNECTING" | "RECONNECTING" | "OFFLINE" | "ERROR";
  fps: number;
  latency_ms: number;
  last_seen: string;
}

let initialCameras: CameraItem[] = [
  {
    id: "cam_entrance",
    name: "Main Entrance",
    rtsp_url: "rtsp://192.168.1.101:554/stream1",
    transport: "tcp",
    resolution: "1920x1080",
    target_fps: 25,
    enabled: true,
    is_test_source: true,
    zone: "Entrance",
    username: "admin",
    status: "CONNECTED",
    fps: 24.8,
    latency_ms: 18,
    last_seen: new Date().toISOString(),
  },
  {
    id: "cam_lobby",
    name: "Central Lobby",
    rtsp_url: "rtsp://192.168.1.102:554/stream1",
    transport: "tcp",
    resolution: "1920x1080",
    target_fps: 25,
    enabled: true,
    is_test_source: true,
    zone: "Lobby",
    username: "admin",
    status: "CONNECTED",
    fps: 25.0,
    latency_ms: 22,
    last_seen: new Date().toISOString(),
  },
  {
    id: "cam_parking",
    name: "North Parking",
    rtsp_url: "rtsp://192.168.1.103:554/stream1",
    transport: "tcp",
    resolution: "1280x720",
    target_fps: 20,
    enabled: true,
    is_test_source: true,
    zone: "Parking",
    status: "CONNECTED",
    fps: 19.8,
    latency_ms: 31,
    last_seen: new Date().toISOString(),
  },
  {
    id: "cam_storage",
    name: "Secure Storage Room",
    rtsp_url: "rtsp://192.168.1.104:554/stream1",
    transport: "tcp",
    resolution: "1280x720",
    target_fps: 15,
    enabled: false,
    is_test_source: false,
    zone: "Restricted Storage",
    status: "OFFLINE",
    fps: 0.0,
    latency_ms: 0,
    last_seen: new Date(Date.now() - 3600000).toISOString(),
  },
];

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  source: string;
  message: string;
}

let systemLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
    level: "INFO",
    source: "Core.Config",
    message: "Loaded configuration from config.yaml successfully (Phase 1 Baseline).",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 95000).toLocaleTimeString(),
    level: "INFO",
    source: "CameraManager",
    message: "Initialized 4 cameras. Starting active workers for 3 enabled streams.",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 80000).toLocaleTimeString(),
    level: "INFO",
    source: "Worker.cam_entrance",
    message: "Synthetic CCTV video pipeline connected. Resolution: 1920x1080 @ 25 FPS.",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 65000).toLocaleTimeString(),
    level: "INFO",
    source: "Worker.cam_lobby",
    message: "Synthetic CCTV video pipeline connected. Target transport: TCP.",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 40000).toLocaleTimeString(),
    level: "INFO",
    source: "Worker.cam_parking",
    message: "Stream connection established. Buffer depth: 2 frames.",
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 15000).toLocaleTimeString(),
    level: "INFO",
    source: "MainWindow",
    message: "Surveillance dashboard initialized in 2x2 grid mode. Local Privacy Mode: ON.",
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Cameras API
  app.get("/api/cameras", (req, res) => {
    res.json({ cameras: initialCameras });
  });

  app.post("/api/cameras", (req, res) => {
    const newCam: CameraItem = {
      ...req.body,
      id: req.body.id || `cam_${Date.now()}`,
      status: req.body.enabled ? (req.body.is_test_source ? "CONNECTED" : "CONNECTING") : "OFFLINE",
      fps: req.body.enabled ? req.body.target_fps || 25 : 0,
      latency_ms: req.body.enabled ? 20 : 0,
      last_seen: new Date().toISOString(),
    };
    initialCameras.push(newCam);
    
    systemLogs.push({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      source: "CameraManager",
      message: `Added new camera: ${newCam.name} (ID: ${newCam.id}, Zone: ${newCam.zone})`,
    });

    res.status(201).json({ camera: newCam });
  });

  app.put("/api/cameras/:id", (req, res) => {
    const { id } = req.params;
    const index = initialCameras.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Camera not found" });
    }
    initialCameras[index] = {
      ...initialCameras[index],
      ...req.body,
      status: req.body.enabled ? (req.body.is_test_source ? "CONNECTED" : initialCameras[index].status) : "OFFLINE",
    };

    systemLogs.push({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      source: "CameraManager",
      message: `Updated camera settings: ${initialCameras[index].name}`,
    });

    res.json({ camera: initialCameras[index] });
  });

  app.delete("/api/cameras/:id", (req, res) => {
    const { id } = req.params;
    const cam = initialCameras.find((c) => c.id === id);
    initialCameras = initialCameras.filter((c) => c.id !== id);

    if (cam) {
      systemLogs.push({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: "WARNING",
        source: "CameraManager",
        message: `Removed camera stream: ${cam.name} (${id})`,
      });
    }

    res.json({ success: true });
  });

  app.post("/api/cameras/:id/reconnect", (req, res) => {
    const { id } = req.params;
    const cam = initialCameras.find((c) => c.id === id);
    if (!cam) {
      return res.status(404).json({ error: "Camera not found" });
    }
    cam.status = "RECONNECTING";
    systemLogs.push({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: "WARNING",
      source: `Worker.${id}`,
      message: `Manual reconnect triggered for ${cam.name}. Re-negotiating RTSP session...`,
    });

    setTimeout(() => {
      cam.status = "CONNECTED";
      cam.last_seen = new Date().toISOString();
      systemLogs.push({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: "INFO",
        source: `Worker.${id}`,
        message: `Stream reconnected successfully for ${cam.name}.`,
      });
    }, 1500);

    res.json({ camera: cam });
  });

  app.post("/api/cameras/test-connection", (req, res) => {
    const { rtsp_url, transport, is_test_source } = req.body;
    if (is_test_source) {
      return res.json({
        success: true,
        message: "Synthetic test feed initialized successfully.",
        latency_ms: 14,
        resolution: "1920x1080",
        codec: "H.264 / Synthetic Frame Generator",
      });
    }

    if (!rtsp_url || !rtsp_url.startsWith("rtsp://")) {
      return res.status(400).json({
        success: false,
        message: "Invalid RTSP URL format. Must start with rtsp://",
      });
    }

    // Mock RTSP ping response for realistic simulation
    res.json({
      success: true,
      message: `RTSP handshake verified (${transport.toUpperCase()}). Stream active.`,
      latency_ms: Math.floor(Math.random() * 20) + 15,
      resolution: "1920x1080",
      codec: "H.264 / AAC",
    });
  });

  // 2. Health & Metrics API
  app.get("/api/health", (req, res) => {
    const onlineCount = initialCameras.filter((c) => c.status === "CONNECTED").length;
    res.json({
      status: "HEALTHY",
      system_load: {
        cpu_percent: 18 + Math.floor(Math.random() * 8),
        gpu_percent: 24 + Math.floor(Math.random() * 10),
        ram_gb: "3.8 / 16 GB",
        disk_free_percent: 74,
      },
      streams: {
        total: initialCameras.length,
        online: onlineCount,
        offline: initialCameras.length - onlineCount,
        avg_fps: (onlineCount * 24.5) / Math.max(1, onlineCount),
        buffer_status: "HEALTHY (2 frames)",
      },
      privacy_mode: true,
      sqlite_database: "READY (Local WAL mode)",
      version: "1.0.0-phase1",
    });
  });

  // 3. System Logs API
  app.get("/api/logs", (req, res) => {
    res.json({ logs: systemLogs });
  });

  app.post("/api/logs/clear", (req, res) => {
    systemLogs = [
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: "INFO",
        source: "Console",
        message: "Log history cleared by operator.",
      },
    ];
    res.json({ success: true });
  });

  // 4. Configuration API
  app.get("/api/config", (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "smart_cctv_ai", "config", "config.yaml");
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        return res.json({ yaml_content: raw });
      }
    } catch (e) {
      console.error(e);
    }
    res.json({ yaml_content: "# Default config\napplication:\n  name: SMART CCTV AI" });
  });

  app.post("/api/config", (req, res) => {
    try {
      const { yaml_content } = req.body;
      const configPath = path.join(process.cwd(), "smart_cctv_ai", "config", "config.yaml");
      fs.writeFileSync(configPath, yaml_content, "utf-8");
      
      systemLogs.push({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: "INFO",
        source: "Core.Config",
        message: "Configuration file saved and applied.",
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 5. Codebase Viewer API (inspect Python project files)
  app.get("/api/code-files", (req, res) => {
    const basePath = path.join(process.cwd(), "smart_cctv_ai");
    const fileList: { path: string; name: string; category: string }[] = [];

    function scanDir(dir: string, relativeDir: string = "") {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "__pycache__" || entry.name.endsWith(".pyc")) continue;
        const full = path.join(dir, entry.name);
        const rel = path.join(relativeDir, entry.name).replace(/\\/g, "/");
        if (entry.isDirectory()) {
          scanDir(full, rel);
        } else {
          let category = "Core";
          if (rel.includes("cameras")) category = "Camera & Stream Pipeline";
          else if (rel.includes("ui")) category = "Windows PySide6 UI";
          else if (rel.includes("tests")) category = "Automated Tests";
          else if (rel.includes("config")) category = "Configuration";
          else if (rel.endsWith(".md") || rel.endsWith(".txt") || rel.endsWith(".example")) category = "Documentation & Setup";

          fileList.push({
            path: rel,
            name: entry.name,
            category,
          });
        }
      }
    }

    scanDir(basePath);
    res.json({ files: fileList });
  });

  app.get("/api/code-files/content", (req, res) => {
    const reqPath = req.query.path as string;
    if (!reqPath) {
      return res.status(400).json({ error: "path parameter required" });
    }
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(process.cwd(), "smart_cctv_ai", safePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    res.json({ path: safePath, content });
  });

  // 6. AI Assistant API (Gemini server-side integration)
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      if (!ai) {
        // High quality deterministic fallback when no API key is attached
        const lower = query.toLowerCase();
        let fallbackResponse = "";
        if (lower.includes("how many") || lower.includes("count") || lower.includes("occupancy")) {
          const online = initialCameras.filter((c) => c.status === "CONNECTED").length;
          fallbackResponse = `There are currently ${online} online camera streams active across monitored zones (Main Entrance, Central Lobby, North Parking). In Phase 1 baseline, video streaming and FPS monitoring are operational, with anonymous person tracking scheduled for Phase 3.`;
        } else if (lower.includes("camera") || lower.includes("status")) {
          const camNames = initialCameras.map((c) => `${c.name} [${c.status}]`).join(", ");
          fallbackResponse = `Current Camera System Status:\n${camNames}\nAll streams are running locally on low-latency frame buffers.`;
        } else {
          fallbackResponse = `SMART CCTV AI Assistant (Phase 1 Baseline): System is operating with ${initialCameras.length} configured cameras, local privacy mode active (face blur/anonymization enabled), and zero cloud video transmission. Ask me about camera health, RTSP configurations, or stream metrics.`;
        }
        return res.json({ response: fallbackResponse });
      }

      const activeCamsInfo = initialCameras.map((c) => ({
        id: c.id,
        name: c.name,
        zone: c.zone,
        status: c.status,
        fps: c.fps,
        latency_ms: c.latency_ms,
        resolution: c.resolution,
        transport: c.transport,
      }));

      const systemPrompt = `You are the built-in AI Assistant for SMART CCTV AI, a professional Windows surveillance and video analytics dashboard.
You have access to current real-time system facts:
- Active Cameras: ${JSON.stringify(activeCamsInfo, null, 2)}
- Privacy Policy: Local processing only, anonymous tracking only, never infer personal identities, never scrape faces.
- Phase: Phase 1 (Camera Manager, RTSP streams, PySide6 UI, FPS HUD).

Provide direct, concise, professional, and factual answers based strictly on the verified camera and system state above. Never invent facts or personal identities.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: query,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      res.json({ response: response.text || "No response generated." });
    } catch (e: any) {
      console.error("AI Assistant error:", e);
      res.status(500).json({ error: e.message || "Failed to process AI assistant query" });
    }
  });

  // 7. Web Research Service (Search technical docs, ONVIF specs, security standards)
  app.post("/api/web-research", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      if (!ai) {
        return res.json({
          response: `### Technical Reference: ${topic}\n\n**ONVIF & RTSP Best Practices:**\n- **Transport Protocol:** Always prioritize **TCP (rtsp_transport=tcp)** over UDP on production IP networks to prevent UDP packet drop and frame tearing.\n- **Buffer Sizing:** Set cv2.CAP_PROP_BUFFERSIZE to 1 or 2 frames to avoid accumulation of frame latency in live security dashboards.\n- **Credential Handling:** Use Windows Credential Manager or local encrypted configuration rather than cleartext URLs.\n- **Profiles:** ONVIF Profile S (basic video streaming), Profile T (advanced video streaming & H.265/analytics), and Profile G (edge storage/recording).`,
          sources: [
            { title: "ONVIF Standard Specifications (Profile S/T/G)", uri: "https://www.onvif.org/specs/" },
            { title: "FFmpeg & OpenCV RTSP Latency Guidelines", uri: "https://trac.ffmpeg.org/wiki/StreamingGuide" },
          ],
        });
      }

      const researchPrompt = `You are the Web Technical Research Assistant for SMART CCTV AI.
Your purpose is to research camera hardware standards, ONVIF Profile S/T/G specifications, RTSP streaming guidelines, security recommendations, and manufacturer documentation.
PRIVACY MANDATE: You must NEVER search for or analyze personal individuals or CCTV imagery.

Topic to research: "${topic}".
Provide a concise, technical, professional summary with practical configuration advice for CCTV engineers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: researchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || "Technical Documentation",
          uri: chunk.web?.uri || "#",
        }))
        .filter((s: any) => s.uri !== "#");

      res.json({
        response: response.text || "No research data available.",
        sources: sources.slice(0, 5),
      });
    } catch (e: any) {
      console.error("Web research error:", e);
      res.status(500).json({ error: e.message || "Failed to execute web research" });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SMART CCTV AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
