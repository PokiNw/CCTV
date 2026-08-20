import React, { useState, useEffect } from "react";
import { CodeFile } from "../types";
import { FolderTree, FileCode, Copy, Check, Download, ExternalLink, Terminal, ChevronRight } from "lucide-react";

export const PythonProjectExplorer: React.FC = () => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("main.py");
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/code-files")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data.files || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    setLoading(true);
    fetch(`/api/code-files/content?path=${encodeURIComponent(selectedFile)}`)
      .then((res) => res.json())
      .then((data) => {
        setFileContent(data.content || "");
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.split("/").pop() || "file.py";
    a.click();
  };

  // Group files by category
  const categories = Array.from(new Set(files.map((f) => f.category)));

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto space-y-4 text-zinc-200">
      {/* Top Banner */}
      <div className="bg-[#0e0e13] border border-zinc-800/90 p-4.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Windows Python 3.12+ / PySide6 Codebase Explorer</h2>
            <p className="text-xs text-zinc-400">
              Inspect, copy, or download the standalone desktop application source code created in <code className="text-sky-400 font-mono">/smart_cctv_ai</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#181822] hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-zinc-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Code"}
          </button>
          <button
            id="btn-download-file"
            onClick={handleDownload}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download File
          </button>
        </div>
      </div>

      {/* Main Splitter: File Tree Sidebar | Code Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[500px]">
        {/* Left Sidebar: File Tree */}
        <div className="bg-[#0e0e13] border border-zinc-800/90 rounded-2xl p-3.5 overflow-y-auto space-y-4 shadow-sm">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 block">
            Project Files (smart_cctv_ai/)
          </span>

          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <div className="text-[11px] font-semibold text-sky-400 px-2.5 py-1 bg-[#15151f] rounded-lg flex items-center gap-1 border border-zinc-800/60">
                  <ChevronRight className="w-3 h-3 text-sky-400" />
                  <span>{cat}</span>
                </div>
                <div className="space-y-0.5 pl-2">
                  {files
                    .filter((f) => f.category === cat)
                    .map((f) => (
                      <button
                        key={f.path}
                        onClick={() => setSelectedFile(f.path)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition ${
                          selectedFile === f.path
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-[#15151e]"
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate">{f.path}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="md:col-span-2 bg-[#0e0e13] border border-zinc-800/90 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-4 py-2.5 bg-[#121217] border-b border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-300">
            <span className="flex items-center gap-2 font-medium">
              <FileCode className="w-4 h-4 text-sky-400" />
              {selectedFile}
            </span>
            <span className="text-zinc-500 text-[11px]">
              {fileContent.split("\n").length} lines • Python / Text
            </span>
          </div>

          <div className="flex-1 p-4.5 overflow-auto font-mono text-xs text-zinc-200 bg-[#09090c]">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                Loading source code...
              </div>
            ) : (
              <pre className="leading-relaxed whitespace-pre-wrap font-mono text-sky-100">{fileContent}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
