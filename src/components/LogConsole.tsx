import React, { useState } from "react";
import { LogEntry } from "../types";
import { Trash2, Download, Search, Terminal, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs, onClear }) => {
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    const matchesSearch =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const exportLogsAsJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cctv_logs_${Date.now()}.json`;
    a.click();
  };

  const exportLogsAsCSV = () => {
    const headers = "timestamp,level,source,message\n";
    const rows = logs
      .map((l) => `"${l.timestamp}","${l.level}","${l.source}","${l.message.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cctv_logs_${Date.now()}.csv`;
    a.click();
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-red-500/10 border border-red-500/20 text-red-400">ERR</span>;
      case "WARNING":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400">WARN</span>;
      case "DEBUG":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400">DBG</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-sky-500/10 border border-sky-500/20 text-sky-400">INFO</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e13] border border-zinc-800/90 rounded-2xl overflow-hidden text-xs shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#121217] border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Terminal className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-zinc-100">System Logs & Event Timeline</span>
          <span className="text-[11px] text-zinc-500 font-mono">({filteredLogs.length} events)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <select
            id="filter-log-level"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-[#181822] border border-zinc-700/80 text-zinc-300 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-zinc-500"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warnings</option>
            <option value="ERROR">Errors</option>
            <option value="DEBUG">Debug</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-log-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="bg-[#181822] border border-zinc-700/80 text-zinc-300 rounded-lg pl-7 pr-2.5 py-1 text-[11px] w-28 sm:w-36 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <button
            id="btn-export-csv"
            onClick={exportLogsAsCSV}
            title="Export CSV"
            className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition flex items-center gap-1 text-[11px] border border-zinc-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            id="btn-clear-logs"
            onClick={onClear}
            title="Clear Logs"
            className="px-2 py-1 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition flex items-center gap-1 text-[11px] border border-zinc-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] divide-y divide-zinc-800/40 p-1.5 bg-[#0a0a0d]">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-xs">
            <Info className="w-5 h-5 mb-1" />
            <span>No log messages matching current filter</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 py-1.5 px-2 hover:bg-zinc-900/60 transition rounded">
              <span className="text-zinc-500 shrink-0 select-none text-[10px]">{log.timestamp}</span>
              <div className="shrink-0">{getLevelBadge(log.level)}</div>
              <span className="text-zinc-400 font-semibold shrink-0">[{log.source}]</span>
              <span className="text-zinc-300 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
