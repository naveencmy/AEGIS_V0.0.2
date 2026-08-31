import { useState, useEffect, useCallback } from 'react';
import { endpoints } from '../lib/api';

export function useAudit(auditId = null) {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAudit = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.getAudit(id);
      setAuditData(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAudit = async (deviceConfigId, frameworks) => {
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.createAudit({
        device_config_id: deviceConfigId,
        frameworks: frameworks,
      });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auditId) {
      fetchAudit(auditId);
      
      // Auto-poll if job is queued or running
      const interval = setInterval(async () => {
        if (auditData && (auditData.status === 'queued' || auditData.status === 'running')) {
          const updated = await fetchAudit(auditId);
          if (updated && (updated.status === 'completed' || updated.status === 'failed')) {
            clearInterval(interval);
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [auditId, fetchAudit, auditData?.status]);

  return {
    auditData,
    loading,
    error,
    fetchAudit,
    triggerAudit,
  };
}
