import { useState, useEffect } from 'react';
import { LoadingState } from './components/LoadingState';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Toast } from './components/Toast';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Movements } from './pages/Movements';
import { Suppliers } from './pages/Suppliers';
import { useInventoryData } from './hooks/useInventoryData';

export function App() {
  const [activeView, setActiveView] = useState('inventory');
  const [toast, setToast] = useState('');

  const {
    products,
    pagination,
    summary,
    movements,
    suppliers,
    initialLoading,
    isFetching,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deactivateProduct,
    addMovement,
    importProductsCsv,
    addSupplier,
    removeSupplier
  } = useInventoryData();

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    if (error) showToast(error);
  }, [error]);

  const handleAddProduct = async (payload) => {
    try {
      await addProduct(payload);
      showToast('Product successfully added to inventory');
    } catch (err) {
      showToast(err.message || 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (id, payload) => {
    try {
      await updateProduct(id, payload);
      showToast('Product details updated');
    } catch (err) {
      showToast(err.message || 'Failed to update product');
    }
  };

  const handleDeactivateProduct = async (id) => {
    try {
      await deactivateProduct(id);
      showToast('Product deactivated from catalog');
    } catch (err) {
      showToast(err.message || 'Failed to deactivate product');
    }
  };

  const handleRestock = async (productId, quantity, reason = 'Supplier Restock') => {
    try {
      await addMovement({
        productId,
        type: 'stock_in',
        quantity,
        reason
      });
      showToast(`Restocked +${quantity} units recorded in audit log`);
    } catch (err) {
      showToast(err.message || 'Failed to record restock');
    }
  };

  const handleStockOut = async (productId, quantity, reason = 'Issued / Stock Out') => {
    try {
      await addMovement({
        productId,
        type: 'stock_out',
        quantity,
        reason
      });
      showToast(`Stock out −${quantity} units logged in audit trail`);
    } catch (err) {
      showToast(err.message || 'Failed to record stock out');
    }
  };

  const handleImportCsv = async (items) => {
    try {
      const res = await importProductsCsv(items);
      showToast(`Imported ${res.createdCount} new, updated ${res.updatedCount} items`);
      return res;
    } catch (err) {
      showToast(err.message || 'Import failed');
      throw err;
    }
  };

  const handleAddSupplier = async (payload) => {
    try {
      await addSupplier(payload);
      showToast('Supplier successfully saved');
    } catch (err) {
      showToast(err.message || 'Failed to save supplier');
    }
  };

  const handleRemoveSupplier = async (id) => {
    try {
      await removeSupplier(id);
      showToast('Supplier removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove supplier');
    }
  };

  const views = {
    dashboard: (
      <Dashboard
        summary={summary}
        products={products}
        movements={movements}
        onNavigate={setActiveView}
      />
    ),
    inventory: (
      <Inventory
        products={products}
        pagination={pagination}
        suppliers={suppliers}
        isFetching={isFetching}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeactivateProduct={handleDeactivateProduct}
        onRestock={handleRestock}
        onStockOut={handleStockOut}
        onImportCsv={handleImportCsv}
        fetchProducts={fetchProducts}
      />
    ),
    movements: (
      <Movements
        movements={movements}
        products={products}
      />
    ),
    suppliers: (
      <Suppliers
        suppliers={suppliers}
        onAddSupplier={handleAddSupplier}
        onRemoveSupplier={handleRemoveSupplier}
      />
    ),
    reports: (
      <Reports
        dashboard={{ summary, totals: summary }}
        products={products}
        sales={[]}
      />
    )
  };

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Mobile Top Navigation & Drawer */}
      <MobileNav
        activeView={activeView}
        setActiveView={setActiveView}
        mode="mysql"
      />

      <main className="main-panel">
        <Topbar mode="mysql" />
        {initialLoading ? (
          <LoadingState />
        ) : (
          views[activeView] || views.inventory
        )}
      </main>

      <Toast message={toast} />
    </div>
  );
}
