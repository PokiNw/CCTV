import React, { useState, useEffect } from "react";
import { SurveillanceDashboard } from "./components/SurveillanceDashboard";
import { AIAssistantTab } from "./components/AIAssistantTab";
import { ConfigEditorTab } from "./components/ConfigEditorTab";
import { PythonProjectExplorer } from "./components/PythonProjectExplorer";
import { RoadmapTab } from "./components/RoadmapTab";
import {
  Cctv,
  Video,
  Bot,
  FileCode,
  FolderTree,
  ListOrdered,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<"surveillance" | "ai" | "config" | "code" | "roadmap">("surveillance");
  const [privacyMode, setPrivacyMode] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Bento Header Bar */}
      <header className="bg-[#0b0b0f]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 shrink-0 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-950/40 text-sky-400">
            <Cctv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                SMART CCTV AI
                <span className="text-[10px] font-mono tracking-wide font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                  PHASE 1
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 font-normal tracking-normal">
              Low-Latency RTSP Stream Pipeline & Desktop Control Core
            </p>
          </div>
        </div>

        {/* Center Bento Navigation Pills */}
        <nav className="flex items-center gap-1 bg-[#121218] p-1.5 rounded-2xl border border-zinc-800/90 text-xs overflow-x-auto shadow-inner">
          <button
            id="nav-tab-surveillance"
            onClick={() => setActiveTab("surveillance")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "surveillance"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <Video className="w-3.5 h-3.5 text-sky-400" />
            <span>Surveillance Grid</span>
          </button>

          <button
            id="nav-tab-ai"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "ai"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Assistant & Research</span>
          </button>

          <button
            id="nav-tab-config"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "config"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>config.yaml</span>
          </button>

          <button
            id="nav-tab-code"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "code"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            <span>Python Desktop Code</span>
          </button>

          <button
            id="nav-tab-roadmap"
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === "roadmap"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-purple-400" />
            <span>Roadmap & Test Matrix</span>
          </button>
        </nav>

        {/* Right Bento Status Modules */}
        <div className="flex items-center gap-2.5">
          {/* Privacy Mode Switch Pill */}
          <button
            id="btn-toggle-privacy"
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "Privacy Mode Active (Face Blurring & Anonymous IDs)" : "Privacy Mode Disabled"}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
              privacyMode
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${privacyMode ? "text-emerald-400" : "text-zinc-500"}`} />
            <span className="hidden sm:inline">Privacy Mode:</span>
            <span className={privacyMode ? "text-emerald-400" : "text-zinc-400"}>{privacyMode ? "ON" : "OFF"}</span>
          </button>

          {/* System Online Live Badge */}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="font-semibold tracking-wider text-[11px]">LIVE</span>
          </div>

          {/* Bento Clock Pill */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-[#121218] px-3 py-1.5 rounded-xl border border-zinc-800/80">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{currentTime || "00:00:00"}</span>
          </div>
        </div>
      </header>

      {/* Main Bento Workspace View */}
      <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto max-w-[1600px] w-full mx-auto">
        {activeTab === "surveillance" && <SurveillanceDashboard privacyMode={privacyMode} />}
        {activeTab === "ai" && <AIAssistantTab />}
        {activeTab === "config" && <ConfigEditorTab />}
        {activeTab === "code" && <PythonProjectExplorer />}
        {activeTab === "roadmap" && <RoadmapTab />}
      </main>
    </div>
  );
}

export default App;
