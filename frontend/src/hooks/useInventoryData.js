import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * Central data hook: loads products/services/sales plus the stock-movement
 * audit trail and suppliers, and exposes CRUD/stock actions that hit the API
 * then refresh local state. Components keep receiving the same field names.
 */
export function useInventoryData() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [sales, setSales] = useState([]);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [productRows, serviceRows, saleRows, movementRows, supplierRows] = await Promise.all([
        api.products.list(),
        api.services.list(),
        api.sales.list(),
        api.movements.list(),
        api.suppliers.list()
      ]);
      setProducts(productRows);
      setServices(serviceRows);
      setSales(saleRows);
      setMovements(movementRows);
      setSuppliers(supplierRows.filter((s) => s.isActive !== false));
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

  const updateProduct = async (id, payload) => {
    await api.products.update(id, payload);
    await refresh();
  };

  const deactivateProduct = async (id) => {
    await api.products.remove(id);
    await refresh();
  };

  const recordSale = async (payload) => {
    await api.sales.create(payload);
    await refresh();
  };

  const addMovement = async (payload) => {
    await api.movements.create(payload);
    await refresh();
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
    services,
    sales,
    movements,
    suppliers,
    loading,
    error,
    refresh,
    addProduct,
    updateProduct,
    deactivateProduct,
    recordSale,
    addMovement,
    addSupplier,
    removeSupplier
  };
}