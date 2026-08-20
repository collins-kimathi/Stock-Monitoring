import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * Loads products/services/sales from the backend and exposes updater
 * functions that hit the API then refresh local state. Returns the same data
 * shape the frontend components already expect.
 */
export function useInventoryData() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [productRows, serviceRows, saleRows] = await Promise.all([
        api.products.list(),
        api.services.list(),
        api.sales.list()
      ]);
      setProducts(productRows);
      setServices(serviceRows);
      setSales(saleRows);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addProduct = async (payload) => {
    await api.products.create(payload);
    await refresh();
  };

  const recordSale = async (payload) => {
    await api.sales.create(payload);
    await refresh();
  };

  return { products, services, sales, loading, error, addProduct, recordSale, refresh };
}