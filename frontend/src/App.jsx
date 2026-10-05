import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuditUpload } from './components/AuditUpload';
import { AuditQuery } from './components/AuditQuery';
import { ComplianceReport } from './components/ComplianceReport';
import { ThreatExplorer } from './components/ThreatExplorer';
import { BlockchainVerifier } from './components/BlockchainVerifier';
import { ConfigDrift } from './components/ConfigDrift';
import { Documentation } from './components/Documentation';
import LandingPage from './components/LandingPage';
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
  const [activeTab,      setActiveTab]      = useState('landing');
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

  // If activeTab is 'landing', display the standalone marketing landing page
  if (activeTab === 'landing') {
    return <LandingPage onEnterApp={(tab = 'dashboard') => setActiveTab(tab)} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>

      {/* ── Dashboard / Command Center ── */}
      {activeTab === 'dashboard' && (
        <Dashboard onTabChange={setActiveTab} onSelectAudit={handleSelectAudit} />
      )}

      {/* ── Compliance Audit Upload ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
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
          onBack={() => setActiveTab('reports')}
          onVerifyBlockchain={() => handleVerifyInBlockchain(currentAuditId)}
          onInspectDrift={() => setActiveTab('drift')}
        />
      )}

      {/* ── Audit History Archive ── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Compliance Audit Runs Archive
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical record of audited network assets, anchored blockchain blocks, and verified regulatory citations.
              </p>
            </div>
            <button
              onClick={loadAudits}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              aria-label="Refresh audit history"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loadingAudits && 'animate-spin')} aria-hidden="true" />
              Refresh
            </button>
          </div>

          {auditsList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-card">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <History className="h-6 w-6" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Audits Executed Yet</h4>
              <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                Execute your first multi-vendor audit in the workbench to generate historical compliance reports and mint cryptographic evidence blocks.
              </p>
              <button
                onClick={() => setActiveTab('audit')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
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
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : audit.compliance_score_percent >= 60
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div
                    key={audit.id}
                    onClick={() => handleSelectAudit(audit.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSelectAudit(audit.id); }}
                    className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-500 hover:shadow-elevated"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-slate-400">
                          {String(audit.id).substring(0, 12)}…
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                          {(audit.framework_filter || []).join(', ') || 'General Audit'}
                        </h4>
                      </div>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-bold font-mono shrink-0', scoreColor)}>
                        {audit.compliance_score_percent}%
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <span>{audit.total_findings} findings</span>
                        {audit.critical_count > 0 && (
                          <span className="text-rose-600 font-mono font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">{audit.critical_count} crit</span>
                        )}
                        {audit.blockchain_anchored && (
                          <span className="flex items-center gap-1 text-purple-700 font-mono text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-semibold">
                            <Lock className="h-2.5 w-2.5" />
                            #{audit.blockchain_block_height}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-brand-600 font-medium group-hover:translate-x-0.5 transition-transform">
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

      {/* ── System Documentation & OpenAPI Reference ── */}
      {activeTab === 'documentation' && <Documentation onTabChange={setActiveTab} />}
    </Layout>
  );
}

