import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuditUpload } from './components/AuditUpload';
import { AuditQuery } from './components/AuditQuery';
import { ComplianceReport } from './components/ComplianceReport';
import { ThreatExplorer } from './components/ThreatExplorer';
import { BlockchainVerifier } from './components/BlockchainVerifier';
import { ConfigDrift } from './components/ConfigDrift';
import { endpoints } from './lib/api';
import { useAudit } from './hooks/useAudit';
import {
  History,
  RefreshCw,
  ArrowRight,
  Upload,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { formatDate, cn } from './lib/utils';

export default function App() {
  const [activeTab,      setActiveTab]      = useState('dashboard');
  const [currentAuditId, setCurrentAuditId] = useState(null);
  const [auditsList,     setAuditsList]     = useState([]);
  const [loadingAudits,  setLoadingAudits]  = useState(false);

  const { auditData, loading: auditLoading, fetchAudit } = useAudit(currentAuditId);

  const loadAudits = async () => {
    setLoadingAudits(true);
    try {
      const res = await endpoints.listAudits();
      setAuditsList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load audits:', err);
    } finally {
      setLoadingAudits(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') loadAudits();
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

  const handleVerifyInBlockchain = (auditId) => {
    setCurrentAuditId(auditId);
    setActiveTab('blockchain');
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>

      {/* ── Dashboard / Command Center ── */}
      {activeTab === 'dashboard' && (
        <Dashboard onTabChange={setActiveTab} />
      )}

      {/* ── Compliance Audit Upload ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Multi-Vendor Network Compliance Audit
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload router or firewall configurations to run automated regulatory audits powered by
              PostgreSQL hybrid RAG and local Mistral-7B reasoning.
            </p>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-6">
            <AuditUpload onAuditCreated={handleAuditCreated} />
          </div>
        </div>
      )}

      {/* ── RAG Assistant ── */}
      {activeTab === 'query' && <AuditQuery />}

      {/* ── Configuration Drift & Regression Monitor ── */}
      {activeTab === 'drift' && <ConfigDrift />}

      {/* ── Blockchain Evidence Ledger ── */}
      {activeTab === 'blockchain' && (
        <BlockchainVerifier initialAuditId={currentAuditId} />
      )}

      {/* ── Report viewer (post-audit) ── */}
      {activeTab === 'report_view' && (
        <ComplianceReport
          auditData={auditData}
          onBack={() => setActiveTab('audit')}
          onVerifyBlockchain={() => handleVerifyInBlockchain(currentAuditId)}
        />
      )}

      {/* ── Audit History ── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
                Compliance Audit Runs Archive
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Historical record of audited network assets, anchored blockchain blocks, and verified regulatory citations.
              </p>
            </div>
            <button
              onClick={loadAudits}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:border-surface-border-hi transition-all"
              aria-label="Refresh audit history"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loadingAudits && 'animate-spin')} aria-hidden="true" />
              Refresh
            </button>
          </div>

          {auditsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-border p-14 text-center">
              <History className="mx-auto h-10 w-10 text-slate-700 mb-3" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-slate-400">No Audits Executed Yet</h4>
              <p className="text-xs text-slate-600 mt-1 mb-5">
                Execute your first audit to generate historical compliance reports and mint blockchain evidence blocks.
              </p>
              <button
                onClick={() => setActiveTab('audit')}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
              >
                <Upload className="h-3.5 w-3.5" />
                Launch New Audit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {auditsList.map((audit) => {
                const scoreColor =
                  audit.compliance_score_percent >= 85
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : audit.compliance_score_percent >= 60
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30';

                return (
                  <div
                    key={audit.id}
                    onClick={() => handleSelectAudit(audit.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSelectAudit(audit.id); }}
                    className="group cursor-pointer rounded-xl border border-surface-border bg-surface-card/80 p-5 transition-all hover:border-indigo-500/40 hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-slate-500">
                          {String(audit.id).substring(0, 12)}…
                        </span>
                        <h4 className="mt-1 text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">
                          {(audit.framework_filter || []).join(', ')}
                        </h4>
                      </div>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-bold font-mono shrink-0', scoreColor)}>
                        {audit.compliance_score_percent}%
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-surface-border pt-3">
                      <div className="flex items-center gap-2">
                        <span>{audit.total_findings} findings</span>
                        {audit.critical_count > 0 && (
                          <span className="text-red-400 font-mono font-semibold">{audit.critical_count} crit</span>
                        )}
                        {audit.blockchain_anchored && (
                          <span className="flex items-center gap-0.5 text-purple-400 font-mono text-[10px] bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-500/25">
                            <Lock className="h-2.5 w-2.5" />
                            #{audit.blockchain_block_height}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        <span>View Report</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Standards Explorer ── */}
      {activeTab === 'frameworks' && <ThreatExplorer />}
    </Layout>
  );
}
