import React, { useState } from "react";
import { Bot, Search, Sparkles, Send, ExternalLink, ShieldCheck, HelpCircle, Loader2, BookOpen, AlertCircle } from "lucide-react";

export const AIAssistantTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"assistant" | "research">("assistant");

  // AI Assistant Chat State
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your SMART CCTV AI Assistant. I can analyze system facts, verify camera stream statuses, explain event logs, and answer configuration queries using local verified data. How can I assist you?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Web Research State
  const [researchQuery, setResearchQuery] = useState("ONVIF Profile T vs Profile S RTSP streaming differences");
  const [researchResult, setResearchResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);
  const [loadingResearch, setLoadingResearch] = useState(false);

  const sampleQueries = [
    "How many cameras are currently connected?",
    "Which camera has the lowest latency?",
    "Explain the Phase 1 video pipeline architecture.",
    "Why should RTSP use TCP instead of UDP in production?",
  ];

  const handleSendAssistant = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loadingAI) return;

    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { sender: "user", text: query, time: userTime }]);
    if (!textToSend) setInputPrompt("");
    setLoadingAI(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.response || "No response received.",
          time: aiTime,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Error processing request: ${e.message}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRunResearch = async (topicToSearch?: string) => {
    const topic = topicToSearch || researchQuery;
    if (!topic.trim() || loadingResearch) return;

    setLoadingResearch(true);
    setResearchResult(null);

    try {
      const res = await fetch("/api/web-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      setResearchResult({
        text: data.response,
        sources: data.sources || [],
      });
    } catch (e: any) {
      setResearchResult({
        text: `Error performing research: ${e.message}`,
        sources: [],
      });
    } finally {
      setLoadingResearch(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto space-y-4 text-zinc-200">
      {/* Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-2">
          <button
            id="tab-ai-assistant"
            onClick={() => setActiveSubTab("assistant")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition ${
              activeSubTab === "assistant"
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "bg-[#121217] text-zinc-400 hover:text-white border border-zinc-800/80"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Surveillance AI Assistant
          </button>
          <button
            id="tab-web-research"
            onClick={() => setActiveSubTab("research")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition ${
              activeSubTab === "research"
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "bg-[#121217] text-zinc-400 hover:text-white border border-zinc-800/80"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            ONVIF & Technical Web Research
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Facial Scraping Policy Enforced</span>
        </div>
      </div>

      {activeSubTab === "assistant" ? (
        <div className="flex flex-col flex-1 bg-[#0e0e13] border border-zinc-800/90 rounded-2xl overflow-hidden min-h-[500px] shadow-sm">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    m.sender === "user"
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-[#181822] border border-zinc-700/60 text-sky-400"
                  }`}
                >
                  {m.sender === "user" ? "YOU" : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-zinc-100 text-zinc-900 font-medium"
                      : "bg-[#121217] border border-zinc-800 text-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className="block mt-1.5 text-[10px] opacity-60 text-right">{m.time}</span>
                </div>
              </div>
            ))}
            {loadingAI && (
              <div className="flex items-center gap-2 text-xs text-sky-400 font-medium py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is analyzing camera metrics & telemetry...</span>
              </div>
            )}
          </div>

          {/* Quick Query Pills */}
          <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-[#0a0a0d] flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Suggested Queries:
            </span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendAssistant(q)}
                className="text-[11px] bg-[#14141c] hover:bg-[#1a1a24] text-zinc-300 border border-zinc-800 rounded-full px-3 py-1 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-zinc-800/80 bg-[#121217] flex items-center gap-2.5">
            <input
              id="input-ai-prompt"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendAssistant()}
              placeholder="Ask the AI about camera health, pipeline FPS, or RTSP configuration..."
              className="flex-1 bg-[#181822] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <button
              id="btn-send-ai"
              onClick={() => handleSendAssistant()}
              disabled={loadingAI || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </div>
        </div>
      ) : (
        /* Web Research Sub-Tab */
        <div className="flex flex-col flex-1 bg-[#0e0e13] border border-zinc-800/90 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Technical Camera Standards & Documentation Research
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Search public manufacturer documentation, ONVIF Profile guidelines, and CCTV networking best practices without exposing private stream data.
            </p>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-research-topic"
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunResearch()}
                placeholder="e.g., Hikvision / Dahua ONVIF RTSP URL formatting guidelines..."
                className="w-full bg-[#181822] border border-zinc-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              id="btn-run-research"
              onClick={() => handleRunResearch()}
              disabled={loadingResearch || !researchQuery.trim()}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 shadow-sm"
            >
              {loadingResearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Research Topic
            </button>
          </div>

          {/* Quick topic buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              "ONVIF Profile S vs Profile T",
              "Low latency RTSP FFmpeg capture options",
              "H.265 vs H.264 bandwidth in CCTV",
              "Windows Credential Manager Python keyring",
            ].map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  setResearchQuery(topic);
                  handleRunResearch(topic);
                }}
                className="text-xs bg-[#14141c] hover:bg-[#1a1a24] text-zinc-300 border border-zinc-800 rounded-full px-3 py-1 transition"
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Research Results Display */}
          {researchResult ? (
            <div className="p-5 bg-[#121217] border border-zinc-800 rounded-2xl space-y-4">
              <div className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
                {researchResult.text}
              </div>

              {researchResult.sources.length > 0 && (
                <div className="border-t border-zinc-800/80 pt-3">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2">Grounding References:</h4>
                  <div className="flex flex-wrap gap-2">
                    {researchResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-500">
              Enter a technical camera standard or ONVIF query above to conduct automated research.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
