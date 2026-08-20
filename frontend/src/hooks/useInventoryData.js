import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';

export function useInventoryData() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1
  });
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  // Fetch paginated products with filters
  const fetchProducts = useCallback(async (params = {}) => {
    setIsFetching(true);
    try {
      const res = await api.products.list(params);
      if (res && res.data && res.pagination) {
        setProducts(res.data);
        setPagination(res.pagination);
        if (res.summary) setSummary(res.summary);
      } else if (Array.isArray(res)) {
        setProducts(res);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  }, []);

  // Fetch inventory summary overview
  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.products.summary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // Fetch initial core data once on mount
  const refresh = useCallback(async () => {
    try {
      const [prodRes, moveRes, supRes, sumRes] = await Promise.all([
        api.products.list({ page: 1, limit: 25 }),
        api.movements.list(),
        api.suppliers.list(),
        api.products.summary().catch(() => null)
      ]);

      if (prodRes?.data) {
        setProducts(prodRes.data);
        setPagination(prodRes.pagination);
      } else if (Array.isArray(prodRes)) {
        setProducts(prodRes);
      }

      setMovements(moveRes || []);
      setSuppliers((supRes || []).filter((s) => s.isActive !== false));
      if (sumRes) setSummary(sumRes);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProduct = async (payload) => {
    await api.products.create(payload);
    await refresh();
  };

  const updateProduct = async (id, payload) => {
    await api.products.update(id, payload);
    await refresh();
  };

  const deactivateProduct = async (id) => {
    await api.products.remove(id);
    await refresh();
  };

  const addMovement = async (payload) => {
    await api.movements.create(payload);
    await refresh();
  };

  const importProductsCsv = async (items) => {
    const res = await api.products.importCsv(items);
    await refresh();
    return res;
  };

  const addSupplier = async (payload) => {
    await api.suppliers.create(payload);
    await refresh();
  };

  const removeSupplier = async (id) => {
    await api.suppliers.remove(id);
    await refresh();
  };

  return {
    products,
    pagination,
    summary,
    movements,
    suppliers,
    initialLoading,
    isFetching,
    error,
    refresh,
    fetchProducts,
    fetchSummary,
    addProduct,
    updateProduct,
    deactivateProduct,
    addMovement,
    importProductsCsv,
    addSupplier,
    removeSupplier
  };
}