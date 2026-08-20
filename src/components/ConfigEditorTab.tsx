import React, { useState, useEffect } from "react";
import { Save, RefreshCw, CheckCircle, AlertTriangle, FileCode, Copy, Check } from "lucide-react";
import { load as yamlLoad } from "js-yaml";

export const ConfigEditorTab: React.FC = () => {
  const [yamlContent, setYamlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setYamlContent(data.yaml_content || "");
    } catch (e: any) {
      console.error("Failed to load config:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    // Validate YAML syntax client-side first
    try {
      yamlLoad(yamlContent);
    } catch (err: any) {
      setSaveStatus({
        success: false,
        message: `YAML Syntax Error: ${err.message}`,
      });
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml_content: yamlContent }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ success: true, message: "Configuration successfully saved and applied." });
      } else {
        setSaveStatus({ success: false, message: data.error || "Failed to save configuration." });
      }
    } catch (e: any) {
      setSaveStatus({ success: false, message: e.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-4 text-zinc-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e0e13] border border-zinc-800/90 p-4.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">System Configuration Editor (config.yaml)</h2>
            <p className="text-xs text-zinc-400">
              Manage camera stream parameters, transport defaults, buffer sizing, and local retention policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-yaml"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#181822] hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-zinc-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy YAML"}
          </button>
          <button
            id="btn-reload-config"
            onClick={fetchConfig}
            disabled={loading}
            className="px-3 py-1.5 bg-[#181822] hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
          <button
            id="btn-save-config"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            saveStatus.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
          }`}
        >
          {saveStatus.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Editor Textarea */}
      <div className="flex-1 bg-[#0e0e13] border border-zinc-800/90 rounded-2xl overflow-hidden flex flex-col min-h-[450px] shadow-sm">
        <div className="px-4 py-2.5 bg-[#121217] border-b border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center justify-between">
          <span className="text-zinc-300">smart_cctv_ai/config/config.yaml</span>
          <span className="text-zinc-500">Syntax: YAML 1.2</span>
        </div>
        <textarea
          id="textarea-yaml-config"
          value={yamlContent}
          onChange={(e) => setYamlContent(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full bg-[#09090c] p-4.5 font-mono text-xs text-sky-200 leading-relaxed focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};
