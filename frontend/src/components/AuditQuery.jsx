import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Trash2,
  Copy,
  Check,
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
  "What NIST SP 800-53 controls apply to SSH and remote administrative access?",
];

const FRAMEWORKS = [
  { value: '',               label: 'All Standards'    },
  { value: 'NIST_800_53_R5', label: 'NIST SP 800-53 R5' },
  { value: 'CIS_v8',         label: 'CIS Controls v8'   },
  { value: 'ISO27001_2022',  label: 'ISO 27001:2022'    },
  { value: 'PCI_DSS_4.0',    label: 'PCI-DSS 4.0'       },
];

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 max-w-4xl animate-slide-in-up', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {/* Avatar */}
      <div
        aria-hidden="true"
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs',
          isUser
            ? 'border-indigo-500/40 bg-indigo-950/60 text-indigo-300'
            : 'border-teal-500/40 bg-teal-950/60 text-teal-300'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'group relative rounded-xl p-3.5 max-w-[85vw] md:max-w-2xl',
          isUser
            ? 'border border-indigo-500/25 bg-indigo-950/25 text-slate-100'
            : 'border border-surface-border bg-surface-card text-slate-200'
        )}
      >
        {/* Copy button */}
        <button
          onClick={handleCopy}
          aria-label="Copy message"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-500 hover:text-slate-300"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>

        <div className="prose-sovereign">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>

        {/* Citations */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-surface-border">
            <div className="flex items-center gap-1.5 mb-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Authoritative Regulatory Citations ({msg.sources.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {msg.sources.map((s, idx) => (
                <CitationCard key={idx} citation={s} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 text-[10px] text-slate-600 text-right">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export function AuditQuery() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "**Greetings, Operator.** I am **AEGIS-NTRO**, your sovereign AI compliance auditor.\n\nQuery regulatory standards — **NIST SP 800-53 Rev 5**, **CIS Controls v8**, **ISO 27001:2022**, **PCI-DSS 4.0** — or evaluate multi-vendor firewall compliance with verified citations. Every response is grounded in the authoritative control database.",
      sources: [],
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputQuery,        setInputQuery]        = useState('');
  const [isLoading,         setIsLoading]         = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [showSuggestions,   setShowSuggestions]   = useState(true);
  const chatBottomRef = useRef(null);
  const inputRef      = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(async (queryText = inputQuery) => {
    const text = queryText.trim();
    if (!text || isLoading) return;

    setShowSuggestions(false);
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() },
    ]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await endpoints.complianceQuery({
        query: text,
        framework: selectedFramework || null,
        top_k: 5,
      });
      setMessages((prev) => [
        ...prev,
        {
          id:         `bot-${Date.now()}`,
          role:       'assistant',
          content:    res.data.answer,
          sources:    res.data.sources || [],
          confidence: res.data.confidence,
          timestamp:  new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id:        `err-${Date.now()}`,
          role:      'assistant',
          content:   `**System Alert**: ${err.response?.data?.detail || err.message || 'Failed to retrieve compliance reasoning'}`,
          sources:   [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputQuery, isLoading, selectedFramework]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "**Session cleared.** Ready for new compliance queries.",
      sources: [],
      timestamp: new Date().toISOString(),
    }]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex h-[calc(100vh-148px)] flex-col rounded-xl border border-surface-border bg-surface-card overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface-raised/80 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/25">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">
              Sovereign RAG Compliance Assistant
            </h3>
            <p className="text-[10px] text-slate-500">
              PostgreSQL 16 Hybrid Retrieval &bull; Local Mistral-7B Reasoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="fw-select" className="text-xs font-semibold text-slate-400 sr-only">
            Filter Standard:
          </label>
          <select
            id="fw-select"
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-base/80 px-2.5 py-1 text-xs font-medium text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <button
            onClick={clearHistory}
            aria-label="Clear conversation history"
            className="flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1 text-xs text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      {/* ── Message stream ── */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Compliance conversation transcript"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Thinking indicator */}
        {isLoading && (
          <div role="status" aria-live="assertive" className="flex gap-3 mr-auto max-w-xl">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-teal-500/40 bg-teal-950/60 text-teal-300">
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-card p-3 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </span>
                <span className="font-mono text-[10px]">
                  Running dense &amp; sparse hybrid retrieval over regulatory database…
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* ── Suggested queries ── */}
      {showSuggestions && (
        <div className="border-t border-surface-border bg-surface-raised/50 px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] pb-0.5">
            <HelpCircle className="h-3 w-3 shrink-0 text-indigo-400" aria-hidden="true" />
            <span className="shrink-0 font-semibold text-slate-400">Quick queries:</span>
            {SUGGESTED_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                aria-label={`Ask: ${q}`}
                className="shrink-0 rounded-md border border-surface-border bg-surface-card px-2.5 py-1 text-slate-400 hover:border-indigo-500/50 hover:text-white transition-colors"
              >
                {q.length > 55 ? `${q.substring(0, 55)}…` : q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input form ── */}
      <div className="border-t border-surface-border bg-surface-raised/80 p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center gap-2"
        >
          <label htmlFor="compliance-query-input" className="sr-only">
            Ask a regulatory compliance query
          </label>
          <input
            id="compliance-query-input"
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a compliance query… (e.g., 'What does NIST SC-7 require for firewalls?')"
            className="flex-1 rounded-lg border border-surface-border bg-surface-base/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            aria-label="Send compliance query"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>
        <p className="mt-1.5 text-[10px] text-slate-600 text-center">
          All responses are grounded in the authoritative regulatory database &bull; Zero hallucination contract
        </p>
      </div>
    </div>
  );
}
