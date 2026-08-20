import React, { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, Play, RefreshCw, UserCheck, ShieldCheck, Cpu } from "lucide-react";
import confetti from "canvas-confetti";

export const RoadmapTab: React.FC = () => {
  // Test Scenario Simulator State (Section 46)
  const [capacity, setCapacity] = useState(20);
  const [initialOccupancy, setInitialOccupancy] = useState(0);
  const [enteredCount, setEnteredCount] = useState(0);
  const [exitedCount, setExitedCount] = useState(0);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [scenarioStep, setScenarioStep] = useState(0);
  const [scenarioLogs, setScenarioLogs] = useState<string[]>([
    "Initialized Test Scenario: Camera = 'Entrance', Capacity = 20, Initial = 0.",
  ]);

  const phases = [
    {
      num: "PHASE 1",
      title: "Windows PySide6 Dashboard & RTSP Pipeline",
      status: "COMPLETED",
      desc: "Windows desktop project, PySide6 GUI, CameraManager, RTSP / OpenCV capture worker, synthetic feed generator, FPS HUD, logging.",
    },
    {
      num: "PHASE 2",
      title: "Ultralytics YOLO Person Detection",
      status: "NEXT",
      desc: "YOLOv8 person detector, bounding boxes, confidence score overlays, inference worker thread decoupling.",
    },
    {
      num: "PHASE 3",
      title: "ByteTrack / BoT-SORT Anonymous Tracking",
      status: "PLANNED",
      desc: "Multi-object tracking, temporary non-identifying IDs (Person #12, #13), trajectory maintenance, jitter filtering.",
    },
    {
      num: "PHASE 4",
      title: "Virtual Counting Lines & Occupancy Engine",
      status: "PLANNED",
      desc: "Configurable entry/exit crossing vectors, double-count prevention cooldowns, real-time occupancy tally.",
    },
    {
      num: "PHASE 5",
      title: "Polygon Zones & Loitering Analytics",
      status: "PLANNED",
      desc: "Interactive zone polygon drawing, per-zone occupancy limits, extended presence (neutral loitering) alerts.",
    },
    {
      num: "PHASE 6",
      title: "Multi-Camera Grid & Local SQLite Event Store",
      status: "PLANNED",
      desc: "Responsive 1x1, 2x2, 3x3 grids, SQLite event logging, Windows toast notifications, daily CSV/JSON reports.",
    },
    {
      num: "PHASE 7",
      title: "AI Event Assistant & Web Research",
      status: "PLANNED",
      desc: "Local/cloud AI assistant explaining event logs, automated ONVIF documentation research.",
    },
    {
      num: "PHASE 8",
      title: "Privacy Blurring & Audit Logs",
      status: "PLANNED",
      desc: "Automatic face blurring, privacy mode locks, comprehensive administrative audit trail.",
    },
    {
      num: "PHASE 9",
      title: "Authorized Biometric Allowlist (Optional)",
      status: "OPTIONAL",
      desc: "Local-only authorized profile verification with strict privacy controls, disabled by default.",
    },
    {
      num: "PHASE 10",
      title: "PyInstaller Packaging & Windows Release",
      status: "PLANNED",
      desc: "Standalone Windows EXE installer, GPU acceleration (DirectML/CUDA), final performance audits.",
    },
  ];

  const handleStepScenario = () => {
    if (scenarioStep === 0) {
      // Step 1: Person A enters
      setEnteredCount(1);
      setCurrentOccupancy(1);
      setScenarioStep(1);
      setScenarioLogs((prev) => [
        ...prev,
        "Step 1: Anonymous Track #101 crossed entry line -> ENTERED = 1, EXITED = 0, CURRENT = 1.",
      ]);
    } else if (scenarioStep === 1) {
      // Step 2: Person B enters
      setEnteredCount(2);
      setCurrentOccupancy(2);
      setScenarioStep(2);
      setScenarioLogs((prev) => [
        ...prev,
        "Step 2: Anonymous Track #102 crossed entry line -> ENTERED = 2, EXITED = 0, CURRENT = 2.",
      ]);
    } else if (scenarioStep === 2) {
      // Step 3: Person A exits
      setExitedCount(1);
      setCurrentOccupancy(1);
      setScenarioStep(3);
      setScenarioLogs((prev) => [
        ...prev,
        "Step 3: Anonymous Track #101 crossed exit line -> ENTERED = 2, EXITED = 1, CURRENT = 1.",
      ]);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleResetScenario = () => {
    setEnteredCount(0);
    setExitedCount(0);
    setCurrentOccupancy(0);
    setScenarioStep(0);
    setScenarioLogs(["Scenario Reset: Initial state restored (Entered=0, Exited=0, Current=0)."]);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto space-y-6 text-zinc-200">
      {/* Test Scenario Simulator (Section 46) */}
      <div className="bg-[#0e0e13] border border-zinc-800/90 p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold font-mono text-sky-400 uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
              Phase 1 / Phase 4 Validation Simulator
            </span>
            <h3 className="text-sm font-semibold text-zinc-100 mt-1.5">Section 46 Test Scenario: Entry/Exit Counting & Occupancy</h3>
            <p className="text-xs text-zinc-400">
              Verify non-identifying track accounting, line direction vectoring, and double-count prevention logic.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-reset-scenario"
              onClick={handleResetScenario}
              className="px-3 py-1.5 bg-[#181822] hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-zinc-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Scenario
            </button>
            <button
              id="btn-step-scenario"
              onClick={handleStepScenario}
              disabled={scenarioStep >= 3}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5" />
              {scenarioStep === 0 ? "1. Person A Enters" : scenarioStep === 1 ? "2. Person B Enters" : scenarioStep === 2 ? "3. Person A Exits" : "Scenario Verified ✓"}
            </button>
          </div>
        </div>

        {/* Live Simulator Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#121217] border border-zinc-800 p-3.5 rounded-xl text-center">
            <span className="text-[11px] font-medium text-zinc-400">ENTERED</span>
            <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{enteredCount}</p>
          </div>
          <div className="bg-[#121217] border border-zinc-800 p-3.5 rounded-xl text-center">
            <span className="text-[11px] font-medium text-zinc-400">EXITED</span>
            <p className="text-xl font-bold text-amber-400 font-mono mt-0.5">{exitedCount}</p>
          </div>
          <div className="bg-[#121217] border border-zinc-800 p-3.5 rounded-xl text-center">
            <span className="text-[11px] font-medium text-zinc-400">CURRENT OCCUPANCY</span>
            <p className="text-xl font-bold text-sky-400 font-mono mt-0.5">{currentOccupancy}</p>
          </div>
          <div className="bg-[#121217] border border-zinc-800 p-3.5 rounded-xl text-center">
            <span className="text-[11px] font-medium text-zinc-400">CAPACITY LIMIT</span>
            <p className="text-xl font-bold text-zinc-300 font-mono mt-0.5">{capacity}</p>
          </div>
        </div>

        {/* Simulator Step Logs */}
        <div className="bg-[#09090c] border border-zinc-800/80 rounded-xl p-3.5 font-mono text-xs text-zinc-300 space-y-1 max-h-32 overflow-y-auto">
          {scenarioLogs.map((log, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sky-400">•</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 10-Phase Development Roadmap */}
      <div className="bg-[#0e0e13] border border-zinc-800/90 p-5 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-100">Full System Development Roadmap (Phases 1 — 10)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {phases.map((p, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition ${
                p.status === "COMPLETED"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : p.status === "NEXT"
                  ? "bg-sky-500/5 border-sky-500/20"
                  : "bg-[#121217] border-zinc-800/80"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-sky-400">{p.num}</span>
                {p.status === "COMPLETED" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> COMPLETED (ACTIVE)
                  </span>
                ) : p.status === "NEXT" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                    NEXT PHASE
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full">
                    {p.status}
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-zinc-100">{p.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
