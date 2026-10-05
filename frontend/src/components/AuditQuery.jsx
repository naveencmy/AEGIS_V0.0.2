import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  X,
  FileText,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { endpoints } from '../lib/api';
import { cn, copyToClipboard } from '../lib/utils';
import CitationBanner from './CitationBanner';

const SUGGESTED_QUERIES = [
  "What are the mandatory requirements for boundary protection under NIST SC-7?",
  "Explain Cisco IOS SSH hardening requirements under CIS Benchmark 4.1.",
  "What does PCI-DSS v4.0 require for administrative network access and encryption?",
  "What are the ISO/IEC 27001:2022 requirements for network segregation in A.8.22?",
];

const FRAMEWORKS = [
  { value: '',               label: 'All Frameworks' },
  { value: 'NIST_800_53_R5', label: 'NIST SP 800-53 R5' },
  { value: 'CIS_v8',         label: 'CIS Controls v8' },
  { value: 'ISO27001_2022',  label: 'ISO 27001:2022' },
  { value: 'PCI_DSS_4.0',    label: 'PCI-DSS v4.0' },
];

export function AuditQuery() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Welcome to **AEGIS-NTRO Sovereign Regulatory Intelligence**. Ask any natural language question regarding firewall hardening, network flow enforcement, or regulatory compliance across **NIST SP 800-53 Rev 5**, **CIS Controls v8**, **ISO 27001:2022**, and **PCI-DSS v4.0**.\n\nAll answers are strictly verified against local PostgreSQL vector records under our **Citation or Silence** guarantee.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProvenance, setActiveProvenance] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText = inputQuery) => {
    const q = (queryText || '').trim();
    if (!q || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await endpoints.complianceQuery({
        query: q,
        framework: selectedFramework || undefined,
      });

      const data = res.data;
      const isSilence =
        !data.sources ||
        data.sources.length === 0 ||
        data.answer?.toLowerCase().includes('insufficient verified') ||
        data.confidence < 0.2;

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        confidence: data.confidence,
        isSilence,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Compliance query error:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "Unable to retrieve verified intelligence. Please verify local PostgreSQL vector connectivity.",
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (text) => {
    await copyToClipboard(text);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sovereign Regulatory Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Ask questions against the verified regulatory repository. Strictly citation-grounded.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:text-slate-800 shadow-sm"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Suggested Prompts Ribbon ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Suggested:
        </span>
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs font-medium text-slate-700 hover:text-brand-700 bg-white hover:bg-brand-50/50 border border-slate-200 hover:border-brand-300 px-3 py-1.5 rounded-full shadow-sm transition-all text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Chat Messages Container ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={cn('flex gap-3 max-w-4xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm',
                    isUser
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 border border-slate-200 text-slate-700'
                  )}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-brand-600" />}
                </div>

                {/* Bubble Container */}
                <div
                  className={cn(
                    'rounded-xl p-4 text-xs leading-relaxed max-w-2xl shadow-sm border space-y-3 relative group',
                    isUser
                      ? 'bg-brand-50/70 border-brand-200 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-800'
                  )}
                >
                  {/* Copy message button */}
                  <button
                    onClick={() => handleCopyMessage(msg.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                    title="Copy response"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Silence State Banner */}
                  {msg.isSilence && (
                    <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        Insufficient Verified Intelligence
                      </div>
                      <p className="text-xs text-amber-800/90 font-medium">
                        The sovereign repository does not contain sufficient verified evidence to answer this query.
                        No unsupported inference was generated.
                      </p>
                    </div>
                  )}

                  {/* Rendered Markdown Body with Crisp Highlighting */}
                  <div className="prose prose-xs max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-900">
                    <ReactMarkdown
                      components={{
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-cyan-950 bg-cyan-100/70 border border-cyan-300/80 px-1.5 py-0.5 rounded shadow-2xs mx-0.5 inline-block" {...props} />
                        ),
                        li: ({ node, children, ...props }) => {
                          const text = React.Children.toArray(children)
                            .map(c => (typeof c === 'string' ? c : c?.props?.children || ''))
                            .join(' ');
                          const isKey = /key|main|critical|mandatory|required|prohibited|must|strictly/i.test(text);
                          return (
                            <li className={cn("cyber-bullet-item text-slate-800 my-1.5 list-none", isKey && "font-medium text-slate-900 bg-cyan-50/50 p-2 rounded-lg border-l-3 border-cyan-500 pl-4 shadow-2xs")} {...props}>
                              {isKey && (
                                <span className="cyber-key-pill text-[9px] mr-1.5 align-middle">
                                  ★ KEY DIRECTIVE
                                </span>
                              )}
                              {children}
                            </li>
                          );
                        },
                        code: ({ node, inline, className, children, ...props }) => (
                          inline ? (
                            <code className="font-mono text-cyan-800 bg-cyan-50/80 border border-cyan-200 px-1.5 py-0.5 rounded text-[11px] font-bold" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="p-3 bg-slate-900 text-cyan-300 font-mono text-xs rounded-lg overflow-x-auto border border-cyan-900/60 my-2 shadow-inner" {...props}>
                              <code>{children}</code>
                            </pre>
                          )
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-cyan-500 bg-cyan-50/40 p-3 rounded-r-lg my-2 text-slate-800" {...props} />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Verified Evidence Citation Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                          Verified Evidence Citations ({msg.sources.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Click chip to view provenance</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveProvenance(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 transition-colors shadow-sm"
                          >
                            <span className="font-mono">{s.control_id}</span>
                            {s.citation_page && <span className="text-brand-600">· p.{s.citation_page}</span>}
                            <ChevronRight className="w-3 h-3 text-brand-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-md mr-auto">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-600">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                Retrieving dense vector records & evaluating citations...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input Box & Send Button ── */}
        <div className="pt-4 border-t border-slate-200 mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask any compliance query (e.g. NIST SC-7 boundary protection requirements)..."
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>

      {/* ── Provenance Right-Side Slide-Out Drawer ── */}
      {activeProvenance && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-drawer h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Verified Provenance Detail</h3>
                    <span className="text-[11px] text-slate-500 font-mono">Control: {activeProvenance.control_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveProvenance(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                  aria-label="Close Provenance Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[11px]">
                    Framework & Standard
                  </span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeProvenance.framework || 'NIST SP 800-53 Rev 5'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[11px]">
                    Control Identifier & Title
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-sm mt-0.5 block">
                    {activeProvenance.control_id}: {activeProvenance.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Section</span>
                    <span className="font-semibold text-slate-800">{activeProvenance.citation_section || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Page Reference</span>
                    <span className="font-semibold text-slate-800">Page {activeProvenance.citation_page || 'N/A'}</span>
                  </div>
                </div>

                {activeProvenance.citation_source && (
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[11px] mb-1">
                      Source Excerpt / Standard Text
                    </span>
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-sans">
                      {activeProvenance.citation_source}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
              {activeProvenance.citation_url && (
                <a
                  href={activeProvenance.citation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                  Open Official Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setActiveProvenance(null)}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
