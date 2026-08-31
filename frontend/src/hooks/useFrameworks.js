import { useState, useEffect, useCallback } from 'react';
import { endpoints } from '../lib/api';

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFrameworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await endpoints.listFrameworks();
      setFrameworks(res.data.frameworks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchControls = async (query, frameworkFilter, page = 1) => {
    setLoading(true);
    try {
      const res = await endpoints.searchFrameworks({
        q: query,
        framework: frameworkFilter,
        page,
        page_size: 20,
      });
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  return {
    frameworks,
    loading,
    error,
    fetchFrameworks,
    searchControls,
  };
}
