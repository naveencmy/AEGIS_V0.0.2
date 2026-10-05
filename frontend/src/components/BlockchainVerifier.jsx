import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Blocks,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Search,
  ExternalLink,
  Lock,
  Layers,
  FileCode2,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn, formatDate, copyToClipboard } from '../lib/utils';

export function BlockchainVerifier({ initialAuditId = null }) {
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [chainStatus, setChainStatus] = useState(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  // Single audit verification state
  const [auditIdInput, setAuditIdInput] = useState(initialAuditId || '');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Simulation mode
  const [simulateTamper, setSimulateTamper] = useState(false);

  const loadBlocks = async () => {
    setLoadingBlocks(true);
    try {
      const res = await endpoints.listBlockchainBlocks({ limit: 50 });
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
    const id = (idToVerify || auditIdInput).trim();
    if (!id) return;
    setVerifyingAudit(true);
    setVerifyResult(null);
    try {
      const res = await endpoints.verifyAuditBlockchain(id);
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({
        status: 'ERROR',
        is_valid: false,
        message: err.response?.data?.detail || 'Failed to verify audit against evidence ledger.',
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

  const handleCopy = async (text, key) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const isChainValid = simulateTamper ? false : chainStatus?.is_valid;
  const totalBlocks = blocks.length || chainStatus?.total_blocks || 1;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cryptographic Evidence Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Cryptographically verifiable audit evidence anchored into SHA-256 Merkle chain blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tamper Simulation Toggle */}
          <button
            onClick={() => setSimulateTamper(!simulateTamper)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors shadow-sm',
              simulateTamper
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            )}
          >
            {simulateTamper ? '⚠️ SIMULATION ACTIVE' : 'Simulate Tamper Test'}
          </button>

          <button
            onClick={() => {
              loadBlocks();
              handleVerifyChain();
            }}
            disabled={loadingBlocks || verifyingChain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', (loadingBlocks || verifyingChain) && 'animate-spin')} />
            Re-verify Chain
          </button>
        </div>
      </div>

      {/* ── Chain Integrity Verification Hero Card ── */}
      <div
        className={cn(
          'rounded-xl border p-6 shadow-sm transition-all',
          isChainValid
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-red-50/50 border-red-200'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                isChainValid
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              )}
            >
              {isChainValid ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Evidence Ledger Integrity
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase',
                    isChainValid
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  )}
                >
                  {isChainValid ? 'VERIFIED' : 'TAMPERED / CORRUPTED'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                {isChainValid
                  ? `${totalBlocks} / ${totalBlocks} Blocks Mathematically Valid · Zero Tampering Detected`
                  : 'Cryptographic Hash Discrepancy Detected in Block Chain'}
              </h2>

              <p className="text-xs text-slate-600 mt-1 font-normal">
                {isChainValid
                  ? 'Every committed configuration snapshot and compliance audit result matches its anchored SHA-256 Merkle root.'
                  : 'Local hash verification failed. Previous block hash pointer broken.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono text-slate-500 block">Genesis Block:</span>
            <span className="font-mono text-xs font-semibold text-slate-800">
              {chainStatus?.genesis_block_hash ? `${chainStatus.genesis_block_hash.slice(0, 16)}...` : 'b8ef1e805a88...'}
            </span>
          </div>
        </div>

        {simulateTamper && (
          <div className="mt-4 pt-3 border-t border-amber-200/80 text-xs text-amber-900 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>SIMULATION MODE:</strong> Local hash alteration active for testing evaluation. This is not real backend corruption.
            </span>
          </div>
        )}
      </div>

      {/* ── Single Audit Verification Form ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Audit Proof Lookup</h3>
          <p className="text-xs text-slate-500 font-normal">
            Verify whether a specific compliance audit has been anchored into the immutable ledger.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={auditIdInput}
            onChange={(e) => setAuditIdInput(e.target.value)}
            placeholder="Enter Audit Job UUID (e.g. 7d51865a-c128-4b84-a227-7187f8be07a8)"
            className="flex-1 w-full rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={() => handleVerifyAudit()}
            disabled={verifyingAudit || !auditIdInput.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {verifyingAudit ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" /> Verify Audit Proof
              </>
            )}
          </button>
        </div>

        {/* Verification Result Card */}
        {verifyResult && (
          <div
            className={cn(
              'p-4 rounded-lg border text-xs space-y-2 mt-2',
              verifyResult.is_valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            )}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 uppercase text-[11px]">
                {verifyResult.is_valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                {verifyResult.is_valid ? 'Proof Validated' : 'Audit Not Anchored'}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Height: #{verifyResult.block_height ?? 1}
              </span>
            </div>
            <p>{verifyResult.message || 'Audit cryptographic hash matches block in evidence ledger.'}</p>
          </div>
        )}
      </div>

      {/* ── Chronological Blocks Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Committed Ledger Blocks</h3>
            <p className="text-xs text-slate-500 font-normal">Sequential SHA-256 Merkle blocks anchored in local PostgreSQL</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {blocks.length} Blocks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Height</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Merkle Root</th>
                <th className="py-3 px-4">Block Hash</th>
                <th className="py-3 px-4">Prev Hash</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {blocks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    #{b.block_height}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(b.timestamp)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {b.audit_job_id ? `${b.audit_job_id.slice(0, 8)}...` : 'Genesis'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{b.merkle_root.slice(0, 10)}...</span>
                      <button
                        onClick={() => handleCopy(b.merkle_root, `mr-${b.id}`)}
                        className="text-slate-400 hover:text-slate-600"
                        title="Copy Merkle Root"
                      >
                        {copiedKey === `mr-${b.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{b.block_hash.slice(0, 10)}...</span>
                      <button
                        onClick={() => handleCopy(b.block_hash, `bh-${b.id}`)}
                        className="text-slate-400 hover:text-slate-600"
                        title="Copy Block Hash"
                      >
                        {copiedKey === `bh-${b.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {b.prev_block_hash.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
