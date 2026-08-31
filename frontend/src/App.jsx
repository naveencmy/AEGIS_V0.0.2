import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AuditUpload } from './components/AuditUpload';
import { AuditQuery } from './components/AuditQuery';
import { ComplianceReport } from './components/ComplianceReport';
import { endpoints } from './lib/api';
import { useAudit } from './hooks/useAudit';
import {
  FileCheck,
  Search,
  ShieldCheck,
  History,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatDate, getSeverityBadge, cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('audit');
  const [currentAuditId, setCurrentAuditId] = useState(null);
  const [auditsList, setAuditsList] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Framework explorer state
  const [frameworksList, setFrameworksList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFrameworkFilter, setSelectedFrameworkFilter] = useState('');
  const [controls, setControls] = useState([]);
  const [totalControls, setTotalControls] = useState(0);
  const [loadingControls, setLoadingControls] = useState(false);

  const { auditData, loading: auditLoading, fetchAudit } = useAudit(currentAuditId);

  // Load audit history
  const loadAudits = async () => {
    setLoadingAudits(true);
    try {
      const res = await endpoints.listAudits();
      setAuditsList(res.data || []);
    } catch (err) {
      console.error("Failed to load audits:", err);
    } finally {
      setLoadingAudits(false);
    }
  };

  // Search framework controls
  const loadControls = async (query = searchQuery, fw = selectedFrameworkFilter) => {
    setLoadingControls(true);
    try {
      const res = await endpoints.searchFrameworks({
        q: query,
        framework: fw || undefined,
        page: 1,
        page_size: 30,
      });
      setControls(res.data.controls || []);
      setTotalControls(res.data.total || 0);
    } catch (err) {
      console.error("Failed to search controls:", err);
    } finally {
      setLoadingControls(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      loadAudits();
    } else if (activeTab === 'frameworks') {
      endpoints.listFrameworks().then((res) => {
        setFrameworksList(res.data.frameworks || []);
      });
      loadControls();
    }
  }, [activeTab]);

  const handleAuditCreated = (auditJobId) => {
    setCurrentAuditId(auditJobId);
    fetchAudit(auditJobId);
    setActiveTab('report_view');
  };

  const handleSelectAudit = (auditId) => {
    setCurrentAuditId(auditId);
    fetchAudit(auditId);
    setActiveTab('report_view');
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Tab 1: Compliance Audit Upload */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Multi-Vendor Network Compliance Audit
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Upload router or firewall configurations to run automated regulatory audits powered by PostgreSQL and local AI reasoning.
            </p>
          </div>

          <AuditUpload onAuditCreated={handleAuditCreated} />
        </div>
      )}

      {/* Tab 2: Natural Language RAG Assistant */}
      {activeTab === 'query' && <AuditQuery />}

      {/* Tab 3: Detailed Report Viewer */}
      {activeTab === 'report_view' && (
        <ComplianceReport
          auditData={auditData}
          onBack={() => setActiveTab('audit')}
        />
      )}

      {/* Tab 4: Audit History */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Compliance Audit Runs Archive
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Historical record of audited network assets and verified regulatory citations.
              </p>
            </div>

            <button
              onClick={loadAudits}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-obsidian-card px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-500 hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingAudits && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {auditsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
              <History className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No Audits Executed Yet</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Execute your first audit to generate historical compliance reports.
              </p>
              <button
                onClick={() => setActiveTab('audit')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Launch New Audit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {auditsList.map((audit) => (
                <div
                  key={audit.id}
                  onClick={() => handleSelectAudit(audit.id)}
                  className="group cursor-pointer rounded-xl border border-indigo-500/20 bg-obsidian-card/70 p-5 backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-400">
                        {audit.id.substring(0, 8)}...
                      </span>
                      <h4 className="mt-1 text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {audit.framework_filter.join(', ')}
                      </h4>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold font-mono",
                        audit.compliance_score_percent >= 80
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      )}
                    >
                      {audit.compliance_score_percent}%
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <span>{audit.total_findings} findings</span>
                    <span className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span>View Report</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Frameworks Standards Explorer */}
      {activeTab === 'frameworks' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Regulatory Standards Knowledge Base
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Authoritative full-text searchable compliance repository running natively on PostgreSQL 16 tsvector.
            </p>
          </div>

          {/* Search Controls */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-500/20 bg-obsidian-card/60 p-4 backdrop-blur-sm">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadControls(e.target.value, selectedFrameworkFilter);
                }}
                placeholder="Search controls (e.g. 'boundary protection', 'AC-4', 'network segregation')..."
                className="w-full rounded-lg border border-slate-700 bg-obsidian/80 pl-10 pr-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedFrameworkFilter}
              onChange={(e) => {
                setSelectedFrameworkFilter(e.target.value);
                loadControls(searchQuery, e.target.value);
              }}
              className="rounded-lg border border-slate-700 bg-obsidian/80 px-3.5 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Standards</option>
              {frameworksList.map((fw) => (
                <option key={fw.framework} value={fw.framework}>
                  {fw.name} ({fw.count})
                </option>
              ))}
            </select>
          </div>

          {/* Controls List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Showing {controls.length} of {totalControls} Authoritative Controls
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {controls.map((c) => {
                const badge = getSeverityBadge(c.severity);
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-indigo-500/20 bg-obsidian-card/70 p-5 backdrop-blur-sm space-y-3 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-xs font-mono font-bold text-indigo-400">
                          {c.control_id}
                        </span>
                        <h4 className="mt-1.5 text-sm font-bold text-slate-100">
                          {c.title}
                        </h4>
                      </div>
                      <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase", badge.bg)}>
                        {c.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {c.description}
                    </p>

                    {c.guidance && (
                      <div className="rounded-lg bg-slate-900/60 p-2.5 text-[11px] text-slate-400 leading-relaxed border border-slate-800">
                        <span className="font-semibold text-indigo-300">Guidance:</span> {c.guidance}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                      <span>{c.framework}</span>
                      {c.source_url && (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <span>Official Standard</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
