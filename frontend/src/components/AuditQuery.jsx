import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { endpoints } from '../lib/api';
import { CitationCard } from './CitationCard';
import { cn } from '../lib/utils';

const SUGGESTED_QUERIES = [
  "What does NIST SC-7 require for boundary protection and default deny?",
  "Which compliance controls prohibit unrestricted permit ip any any firewall rules?",
  "What are the ISO 27001:2022 requirements for network segregation in clause A.8.22?",
  "Explain CIS Control 4.1 regarding secure network configuration baselines.",
];

export function AuditQuery() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Greetings. I am **AEGIS-NTRO**, your sovereign AI compliance auditor. Ask any natural language question about regulatory standards (NIST SP 800-53 Rev 5, CIS Controls v8, ISO 27001:2022, PCI-DSS 4.0) or firewall compliance rules.",
      sources: [],
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText = inputQuery) => {
    const textToSend = queryText.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await endpoints.complianceQuery({
        query: textToSend,
        framework: selectedFramework || null,
        top_k: 5,
      });

      const assistantMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources || [],
        confidence: res.data.confidence,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Error processing query**: ${
          err.response?.data?.detail || err.message || 'Failed to retrieve compliance reasoning'
        }`,
        sources: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-2xl border border-indigo-500/20 bg-obsidian-card/40 backdrop-blur-md overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-indigo-500/20 bg-obsidian/70 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Citation-Native Compliance Chat</h3>
            <p className="text-[11px] text-slate-400">PostgreSQL Hybrid RAG + Local Reasoning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Filter Standard:</label>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="rounded-lg border border-slate-700 bg-obsidian/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Standards</option>
            <option value="NIST_800_53_R5">NIST SP 800-53 R5</option>
            <option value="CIS_v8">CIS Controls v8</option>
            <option value="ISO27001_2022">ISO 27001:2022</option>
            <option value="PCI_DSS_4.0">PCI-DSS 4.0</option>
          </select>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-4xl",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border text-xs",
                msg.role === 'user'
                  ? "border-indigo-500/40 bg-indigo-600/30 text-indigo-300"
                  : "border-cyan-500/40 bg-cyan-600/20 text-cyan-300"
              )}
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble Content */}
            <div
              className={cn(
                "rounded-2xl p-4 text-sm leading-relaxed",
                msg.role === 'user'
                  ? "border border-indigo-500/40 bg-indigo-950/40 text-slate-100"
                  : "border border-indigo-500/20 bg-obsidian/80 text-slate-200 shadow-lg"
              )}
            >
              <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Citations list if available */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-indigo-500/15">
                  <h6 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                    Authoritative Citations ({msg.sources.length})
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {msg.sources.map((s, idx) => (
                      <CitationCard key={idx} citation={s} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-600/20 text-cyan-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-obsidian/80 p-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Running dense & sparse hybrid retrieval over regulatory database...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Queries Chips */}
      <div className="border-t border-indigo-500/10 bg-obsidian/40 px-5 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 pb-1">
          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <span className="shrink-0 font-medium">Quick Prompts:</span>
          {SUGGESTED_QUERIES.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(q)}
              className="shrink-0 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/15 hover:text-white transition-colors"
            >
              {q.length > 55 ? `${q.substring(0, 55)}...` : q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-indigo-500/20 bg-obsidian/90 p-4">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a compliance query (e.g., 'What does NIST SC-7 require for firewalls?')..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isLoading}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
