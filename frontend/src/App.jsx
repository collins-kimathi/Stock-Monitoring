import { useEffect, useState } from 'react';
import { LoadingState } from './components/LoadingState';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Sales } from './pages/Sales';
import { Services } from './pages/Services';
import { Movements } from './pages/Movements';
import { Suppliers } from './pages/Suppliers';
import { useInventoryData } from './hooks/useInventoryData';

function buildDashboard(products, sales) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysSales = sales.filter((sale) => String(sale.createdAt).slice(0, 10) === today);
  const lowStock = products.filter((product) => Number(product.quantity) <= Number(product.reorderLevel));

  return {
    mode: 'mysql',
    totals: {
      products: products.length,
      lowStock: lowStock.length,
      todaySales: todaysSales.length,
      revenue: todaysSales.reduce((sum, sale) => sum + Number(sale.total), 0),
      profit: todaysSales.reduce((sum, sale) => sum + ((Number(sale.unitPrice) - Number(sale.costPrice || 0)) * Number(sale.quantity)), 0),
      expenses: 0,
      inventoryValue: products.reduce((sum, product) => sum + Number(product.quantity) * Number(product.buyingPrice), 0)
    },
    lowStock,
    bestSellers: Object.values(sales.reduce((acc, sale) => {
      acc[sale.itemName] ||= { name: sale.itemName, quantity: 0, revenue: 0 };
      acc[sale.itemName].quantity += Number(sale.quantity);
      acc[sale.itemName].revenue += Number(sale.total);
      return acc;
    }, {})).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  };
}

export function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [toast, setToast] = useState('');
  const {
    products, services, sales, movements, suppliers, loading, error,
    addProduct, updateProduct, deactivateProduct, recordSale, addMovement, addSupplier, removeSupplier
  } = useInventoryData();
  const dashboard = buildDashboard(products, sales);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  useEffect(() => {
    if (error) showToast(error);
  }, [error]);

  const handleAddProduct = async (payload) => {
    try { await addProduct(payload); showToast('Product added to inventory'); } catch (err) { showToast(err.message); }
  };
  const handleUpdateProduct = async (id, payload) => {
    try { await updateProduct(id, payload); showToast('Product updated'); } catch (err) { showToast(err.message); }
  };
  const handleDeactivateProduct = async (id) => {
    try { await deactivateProduct(id); showToast('Product deactivated'); } catch (err) { showToast(err.message); }
  };
  const handleRecordSale = async (payload) => {
    try { await recordSale(payload); showToast('Sale recorded & stock updated'); } catch (err) { showToast(err.message); }
  };
  const handleRestock = async (productId, quantity) => {
    try { await addMovement({ productId, type: 'stock_in', quantity, reason: 'Restock' }); showToast('Stock received'); } catch (err) { showToast(err.message); }
  };
  const handleAddSupplier = async (payload) => {
    try { await addSupplier(payload); showToast('Supplier added'); } catch (err) { showToast(err.message); }
  };
  const handleRemoveSupplier = async (id) => {
    try { await removeSupplier(id); showToast('Supplier removed'); } catch (err) { showToast(err.message); }
  };

  const views = {
    dashboard: <Dashboard dashboard={dashboard} sales={sales} products={products} onNavigate={setActiveView} />,
    inventory: <Inventory products={products} suppliers={suppliers} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeactivateProduct={handleDeactivateProduct} onRestock={handleRestock} />,
    sales: <Sales products={products} onRecordSale={handleRecordSale} />,
    services: <Services services={services} onRecordSale={handleRecordSale} />,
    movements: <Movements movements={movements} products={products} />,
    suppliers: <Suppliers suppliers={suppliers} onAddSupplier={handleAddSupplier} onRemoveSupplier={handleRemoveSupplier} />,
    reports: <Reports dashboard={dashboard} products={products} sales={sales} />
  };

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="main-panel">
        <Topbar mode={dashboard?.mode} />
        {loading && !products.length ? <LoadingState /> : views[activeView]}
      </main>
      <Toast message={toast} />
    </div>
  );
}
