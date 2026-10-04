import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  FileCode,
  FileCheck2,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn, formatDate } from '../lib/utils';

export function BlockchainVerifier({ initialAuditId = null }) {
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [chainStatus, setChainStatus] = useState(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  // Single audit verification
  const [auditIdInput, setAuditIdInput] = useState(initialAuditId || '');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const loadBlocks = async () => {
    setLoadingBlocks(true);
    try {
      const res = await endpoints.listBlockchainBlocks();
      setBlocks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load blockchain blocks:', err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const res = await endpoints.verifyChain();
      setChainStatus(res.data);
    } catch (err) {
      console.error('Failed to verify chain:', err);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleVerifyAudit = async (idToVerify) => {
    const id = idToVerify || auditIdInput;
    if (!id || !id.trim()) return;
    setVerifyingAudit(true);
    setVerifyResult(null);
    try {
      const res = await endpoints.verifyAuditBlockchain(id.trim());
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({
        status: 'ERROR',
        is_valid: false,
        message: err.response?.data?.detail || 'Failed to verify audit against blockchain ledger.',
      });
    } finally {
      setVerifyingAudit(false);
    }
  };

  useEffect(() => {
    loadBlocks();
    handleVerifyChain();
    if (initialAuditId) {
      handleVerifyAudit(initialAuditId);
    }
  }, [initialAuditId]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Immutable Blockchain Evidence Ledger
            </h1>
            <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-xs font-mono font-bold text-purple-300">
              SHA-256 Merkle Chain
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Zero-hallucination compliance audit proofs anchored to a cryptographic distributed ledger for NTRO regulatory verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyChain}
            disabled={verifyingChain}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-600/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/20 transition-all"
          >
            <ShieldCheck className={cn('h-3.5 w-3.5', verifyingChain && 'animate-spin')} />
            {verifyingChain ? 'Verifying Chain…' : 'Validate Full Chain'}
          </button>
          <button
            onClick={loadBlocks}
            disabled={loadingBlocks}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loadingBlocks && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Chain Health Overview ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Minted Blocks</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-100">
            {chainStatus?.total_blocks ?? blocks.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Latest Height: #{chainStatus?.latest_block_height ?? (blocks[0]?.block_height ?? 0)}
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Chain Continuity</span>
            <Lock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            {chainStatus?.is_valid ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 font-mono">100% INTACT</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-sm font-bold text-red-400 font-mono">CORRUPTED</span>
              </>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Genesis Hash: {chainStatus?.genesis_block_hash ? `${chainStatus.genesis_block_hash.substring(0, 10)}…` : 'Verified'}
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Hashing Standard</span>
            <FileCode className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-slate-200">
            SHA-256 Merkle Root
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Dual-Layer Config + Results Hash
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Proof of Compliance</span>
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-base font-bold text-emerald-300 font-mono">
            Zero-Tamper Guarantee
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Self-verifiable via cryptographic API
          </div>
        </div>
      </div>

      {/* ── Independent Audit Tamper Verifier ── */}
      <div className="rounded-2xl border border-purple-500/20 bg-surface-card/80 p-6 shadow-xl">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-400" />
          Independent Cryptographic Audit Verifier
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter an Audit Job ID to recalculate configuration snapshot hash, findings payload hash, and Merkle tree root against the ledger.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={auditIdInput}
              onChange={(e) => setAuditIdInput(e.target.value)}
              placeholder="Paste Audit UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)…"
              className="w-full rounded-xl border border-surface-border bg-surface-raised pl-9 pr-4 py-2.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => handleVerifyAudit(auditIdInput)}
            disabled={verifyingAudit || !auditIdInput.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20"
          >
            {verifyingAudit ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Verify On-Chain Integrity
          </button>
        </div>

        {/* Verification Result Card */}
        {verifyResult && (
          <div className={cn(
            'mt-5 rounded-xl border p-5 transition-all animate-fade-in',
            verifyResult.is_valid
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : 'border-red-500/30 bg-red-950/20'
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {verifyResult.is_valid ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                    <XCircle className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {verifyResult.is_valid ? 'Cryptographic Integrity Verified: 100% UNTAMPERED' : 'Integrity Verification Failed / Tampering Detected'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {verifyResult.status === 'VALID'
                      ? `Anchored on Block #${verifyResult.block_height} at ${formatDate(verifyResult.timestamp)}`
                      : verifyResult.message || `Status: ${verifyResult.status}`}
                  </p>
                </div>
              </div>

              <span className={cn(
                'rounded-md px-2.5 py-1 text-xs font-mono font-bold',
                verifyResult.is_valid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              )}>
                {verifyResult.status}
              </span>
            </div>

            {verifyResult.is_valid && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-surface-border/60 pt-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Merkle Tree Root (SHA-256)
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-purple-300 bg-surface-raised/80 p-2 rounded-lg border border-surface-border">
                    <span className="truncate">{verifyResult.merkle_root}</span>
                    <button
                      onClick={() => copyToClipboard(verifyResult.merkle_root, 'merkle')}
                      className="text-slate-500 hover:text-white shrink-0"
                    >
                      {copiedHash === 'merkle' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Block Hash Digest
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-300 bg-surface-raised/80 p-2 rounded-lg border border-surface-border">
                    <span className="truncate">{verifyResult.block_hash}</span>
                    <button
                      onClick={() => copyToClipboard(verifyResult.block_hash, 'bhash')}
                      className="text-slate-500 hover:text-white shrink-0"
                    >
                      {copiedHash === 'bhash' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Config Snapshot Hash
                  </span>
                  <div className="font-mono text-slate-400 bg-surface-raised/80 p-2 rounded-lg border border-surface-border truncate">
                    {verifyResult.config_snapshot_hash}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Findings Payload Hash
                  </span>
                  <div className="font-mono text-slate-400 bg-surface-raised/80 p-2 rounded-lg border border-surface-border truncate">
                    {verifyResult.audit_results_hash}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Blockchain Ledger Blocks Table ── */}
      <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Mined Ledger Blocks
            </h2>
            <p className="text-xs text-slate-500">
              Cryptographically chained blocks securing enterprise audit records.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {blocks.length} Blocks Recorded
          </span>
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-surface-border rounded-xl text-slate-500 text-xs">
            No blockchain blocks minted yet. Execute an audit to anchor the first compliance block.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Height</th>
                  <th className="py-2.5 px-3">Block Hash</th>
                  <th className="py-2.5 px-3">Merkle Root</th>
                  <th className="py-2.5 px-3">Audit Link</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 font-mono text-slate-300">
                {blocks.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-purple-400">
                      #{b.block_height}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span>{b.block_hash.substring(0, 14)}…</span>
                        <button
                          onClick={() => copyToClipboard(b.block_hash, `bh_${b.block_height}`)}
                          className="text-slate-600 hover:text-white"
                        >
                          {copiedHash === `bh_${b.block_height}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {b.merkle_root ? `${b.merkle_root.substring(0, 12)}…` : 'Genesis'}
                    </td>
                    <td className="py-3 px-3">
                      {b.audit_job_id ? (
                        <button
                          onClick={() => {
                            setAuditIdInput(b.audit_job_id);
                            handleVerifyAudit(b.audit_job_id);
                          }}
                          className="text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>{String(b.audit_job_id).substring(0, 8)}…</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600">GENESIS</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                        {b.compliance_score ? `${b.compliance_score}%` : '100%'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-sans">
                      {formatDate(b.timestamp)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {b.audit_job_id && (
                        <button
                          onClick={() => {
                            setAuditIdInput(b.audit_job_id);
                            handleVerifyAudit(b.audit_job_id);
                          }}
                          className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] font-sans font-semibold text-purple-300 hover:bg-purple-500/20"
                        >
                          Verify Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
