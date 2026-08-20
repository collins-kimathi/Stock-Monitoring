import { useState, useEffect, useRef } from 'react';
import {
  Boxes, Download, FileSpreadsheet, Filter,
  LayoutGrid, List, MapPin, PackagePlus,
  Pencil, Plus, Minus, RefreshCw, Search, Tag, X, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { Panel } from '../components/Panel';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { EmptyState } from '../components/EmptyState';
import { StockBadge, stockHealth } from '../components/StockBadge';
import { Pagination } from '../components/Pagination';
import { BulkImportModal } from '../components/BulkImportModal';
import { money, number } from '../lib/format';
import { api } from '../api/client';

const CATEGORIES = [
  'All', 'Books', 'Stationery', 'Printing', 'Cyber', 'Office',
  'Electronics', 'Packaging', 'Uniforms', 'Other'
];

const STOCK_TABS = [
  ['all', 'All Items'],
  ['in', 'In Stock'],
  ['low', 'Low Stock'],
  ['out', 'Out of Stock']
];

const STOCK_OUT_REASONS = [
  'Sale / Customer Dispatch',
  'School / B2B Order Delivery',
  'Damaged / Broken / Spoilage',
  'Internal Office / Cyber Use',
  'Sample / Promotional Issue',
  'Audit Correction / Inventory Loss',
  'Return to Vendor / Supplier',
  'Other'
];

const blankForm = {
  name: '',
  sku: '',
  barcode: '',
  category: 'Stationery',
  brand: '',
  location: '',
  unit: 'pcs',
  quantity: 0,
  reorderLevel: 10,
  maxLevel: 100,
  buyingPrice: 0,
  wholesalePrice: 0,
  sellingPrice: 0,
  supplierId: '',
  notes: ''
};

export function Inventory({
  products,
  pagination,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeactivateProduct,
  onRestock,
  onStockOut,
  onImportCsv,
  fetchProducts
}) {
  // Filter & query state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showFilters, setShowFilters] = useState(false);

  // Modals state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  
  // Stock In (Restock)
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockReason, setRestockReason] = useState('Supplier Restock');

  // Stock Out (Issue Goods)
  const [stockOutItem, setStockOutItem] = useState(null);
  const [stockOutQty, setStockOutQty] = useState(1);
  const [stockOutReasonType, setStockOutReasonType] = useState(STOCK_OUT_REASONS[0]);
  const [stockOutNote, setStockOutNote] = useState('');

  const [confirmId, setConfirmId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Detect mobile viewport on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setViewMode('cards');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounced search & filter trigger
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts({
        page: 1,
        limit: pagination.limit || 25,
        search,
        category,
        stockStatus,
        supplierId: supplierFilter,
        sortBy,
        sortDir
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [search, category, stockStatus, supplierFilter, sortBy, sortDir, fetchProducts, pagination.limit]);

  // Page changes
  const handlePageChange = (newPage) => {
    fetchProducts({
      page: newPage,
      limit: pagination.limit || 25,
      search,
      category,
      stockStatus,
      supplierId: supplierFilter,
      sortBy,
      sortDir
    });
  };

  const handleLimitChange = (newLimit) => {
    fetchProducts({
      page: 1,
      limit: newLimit,
      search,
      category,
      stockStatus,
      supplierId: supplierFilter,
      sortBy,
      sortDir
    });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm);
    setIsAdding(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setIsAdding(true);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || 'Stationery',
      brand: product.brand || '',
      location: product.location || '',
      unit: product.unit || 'pcs',
      quantity: Number(product.quantity || 0),
      reorderLevel: Number(product.reorderLevel || 0),
      maxLevel: Number(product.maxLevel || 0),
      buyingPrice: Number(product.buyingPrice || 0),
      wholesalePrice: Number(product.wholesalePrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      supplierId: product.supplierId || '',
      notes: product.notes || ''
    });
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      quantity: Math.max(0, Number(form.quantity) || 0),
      reorderLevel: Math.max(0, Number(form.reorderLevel) || 0),
      maxLevel: Math.max(0, Number(form.maxLevel) || 0),
      buyingPrice: Math.max(0, Number(form.buyingPrice) || 0),
      wholesalePrice: Math.max(0, Number(form.wholesalePrice) || 0),
      sellingPrice: Math.max(0, Number(form.sellingPrice) || 0),
      supplierId: form.supplierId || null
    };

    if (editingId) {
      await onUpdateProduct(editingId, payload);
    } else {
      await onAddProduct(payload);
    }
    setIsAdding(false);
    setEditingId(null);
    setForm(blankForm);
  };

  const submitRestock = async (e) => {
    e.preventDefault();
    if (!restockItem) return;
    await onRestock(restockItem.id, Number(restockQty), restockReason);
    setRestockItem(null);
    setRestockQty(10);
    setRestockReason('Supplier Restock');
  };

  const submitStockOut = async (e) => {
    e.preventDefault();
    if (!stockOutItem) return;
    const finalReason = stockOutNote ? `${stockOutReasonType}: ${stockOutNote}` : stockOutReasonType;
    await onStockOut(stockOutItem.id, Number(stockOutQty), finalReason);
    setStockOutItem(null);
    setStockOutQty(1);
    setStockOutNote('');
  };

  // Profit margin calculation for form
  const selling = Number(form.sellingPrice) || 0;
  const cost = Number(form.buyingPrice) || 0;
  const marginPct = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : 0;

  return (
    <section className="view-stack">
      <Panel title="Inventory Catalog" icon={Boxes} className="wide-panel">
        {/* ── Top Header Actions Bar ── */}
        <div className="inventory-header-actions">
          <div className="search-group">
            <label className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by SKU, Barcode, Name, Brand, Shelf..."
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </label>

            <button
              className={`filter-toggle-btn ${showFilters || category !== 'All' || supplierFilter ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>

          <div className="action-buttons-group">
            <div className="view-mode-toggle">
              <button
                className={`icon-btn-toggle ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
                aria-label="Table View"
              >
                <List size={17} />
              </button>
              <button
                className={`icon-btn-toggle ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View (Mobile Optimized)"
                aria-label="Card View"
              >
                <LayoutGrid size={17} />
              </button>
            </div>

            <button
              className="secondary-button"
              onClick={() => setShowImportModal(true)}
              title="Import CSV"
            >
              <FileSpreadsheet size={16} />
              <span>Import</span>
            </button>

            <a
              href={api.products.exportCsvUrl()}
              className="secondary-button"
              download
              title="Export to CSV"
            >
              <Download size={16} />
              <span>Export</span>
            </a>

            <button className="primary-button" onClick={openAdd}>
              <Plus size={17} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* ── Status Pills Bar ── */}
        <div className="stock-tabs-bar">
          <div className="segmented-tabs">
            {STOCK_TABS.map(([key, label]) => (
              <button
                key={key}
                className={`tab-btn ${stockStatus === key ? 'active' : ''}`}
                onClick={() => setStockStatus(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Expandable Filters Drawer ── */}
        {showFilters && (
          <div className="filters-drawer">
            <div className="filter-item">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Supplier</label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="created_at">Date Created</option>
                <option value="name">Product Name</option>
                <option value="quantity">Stock Quantity</option>
                <option value="buyingPrice">Cost Price</option>
                <option value="sellingPrice">Selling Price</option>
                <option value="location">Shelf Location</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Order</label>
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {(category !== 'All' || supplierFilter || search) && (
              <button
                className="reset-filters-btn"
                onClick={() => {
                  setCategory('All');
                  setSupplierFilter('');
                  setSearch('');
                  setStockStatus('all');
                }}
              >
                Reset All
              </button>
            )}
          </div>
        )}

        {/* ── Table View (Desktop) ── */}
        {viewMode === 'table' && products.length > 0 && (
          <div className="table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product &amp; Identifiers</th>
                  <th>Category / Brand</th>
                  <th>Location</th>
                  <th>Stock Level</th>
                  <th>Cost (KES)</th>
                  <th>Retail (KES)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Stock Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const outOfStock = Number(p.quantity) <= 0;
                  return (
                    <tr key={p.id} className="table-row-hover">
                      <td>
                        <strong className="item-title">{p.name}</strong>
                        <div className="sub-meta">
                          {p.sku && <span className="sku-tag">SKU: {p.sku}</span>}
                          {p.barcode && <span className="barcode-tag">||| {p.barcode}</span>}
                        </div>
                      </td>
                      <td>
                        <span>{p.category}</span>
                        {p.brand && <small className="brand-label">{p.brand}</small>}
                      </td>
                      <td>
                        {p.location ? (
                          <span className="location-pill">
                            <MapPin size={12} /> {p.location}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <strong className="qty-number">
                          {number(p.quantity)} <span className="unit-label">{p.unit}</span>
                        </strong>
                        <small className="reorder-hint">Min: {p.reorderLevel}</small>
                      </td>
                      <td>{money(p.buyingPrice)}</td>
                      <td>
                        <strong>{money(p.sellingPrice)}</strong>
                        {p.wholesalePrice > 0 && (
                          <small className="wholesale-hint">WS: {money(p.wholesalePrice)}</small>
                        )}
                      </td>
                      <td>
                        <StockBadge product={p} />
                      </td>
                      <td className="table-actions">
                        <button
                          className="icon-button positive-action"
                          title="Restock (Stock In +)"
                          aria-label="Restock"
                          onClick={() => {
                            setRestockItem(p);
                            setRestockQty(10);
                          }}
                        >
                          <Plus size={15} />
                        </button>
                        <button
                          className="icon-button warning-action"
                          title="Issue Goods (Stock Out -)"
                          aria-label="Issue Stock"
                          disabled={outOfStock}
                          onClick={() => {
                            setStockOutItem(p);
                            setStockOutQty(1);
                            setStockOutReasonType(STOCK_OUT_REASONS[0]);
                          }}
                        >
                          <Minus size={15} />
                        </button>
                        <button
                          className="icon-button"
                          title="Edit Product"
                          aria-label="Edit"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger"
                          title="Deactivate Product"
                          aria-label="Deactivate"
                          onClick={() => setConfirmId(p.id)}
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Card View (Mobile & Tablet Optimized) ── */}
        {viewMode === 'cards' && products.length > 0 && (
          <div className="product-card-grid">
            {products.map((p) => {
              const outOfStock = Number(p.quantity) <= 0;
              return (
                <article className="product-card" key={p.id}>
                  <div className="product-card-head">
                    <div>
                      <span className="product-card-cat">{p.category}</span>
                      <strong className="product-card-title">{p.name}</strong>
                    </div>
                    <StockBadge product={p} />
                  </div>

                  <div className="product-card-meta">
                    {p.sku && <span className="sku-tag">SKU: {p.sku}</span>}
                    {p.location && (
                      <span className="location-pill">
                        <MapPin size={11} /> {p.location}
                      </span>
                    )}
                  </div>

                  <div className="product-card-stats">
                    <div className="stat-col">
                      <span>On Hand</span>
                      <strong>{number(p.quantity)} {p.unit}</strong>
                    </div>
                    <div className="stat-col">
                      <span>Cost</span>
                      <b>{money(p.buyingPrice)}</b>
                    </div>
                    <div className="stat-col">
                      <span>Retail</span>
                      <b className="price-accent">{money(p.sellingPrice)}</b>
                    </div>
                  </div>

                  <div className="product-card-actions">
                    <div className="quick-stock-buttons">
                      <button
                        className="secondary-button small"
                        title="Stock In (+)"
                        onClick={() => {
                          setRestockItem(p);
                          setRestockQty(10);
                        }}
                      >
                        <Plus size={13} /> Receive
                      </button>
                      <button
                        className="secondary-button small"
                        title="Stock Out (-)"
                        disabled={outOfStock}
                        onClick={() => {
                          setStockOutItem(p);
                          setStockOutQty(1);
                        }}
                      >
                        <Minus size={13} /> Issue
                      </button>
                    </div>

                    <div className="card-right-actions">
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button danger"
                        title="Deactivate"
                        onClick={() => setConfirmId(p.id)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── Empty State ── */}
        {products.length === 0 && (
          <EmptyState
            title={search || category !== 'All' ? 'No items match your filters' : 'Catalog is empty'}
            hint={
              search || category !== 'All'
                ? 'Try clearing filters or changing your search terms.'
                : 'Get started by adding your first product or importing a CSV file.'
            }
            action={
              <button className="primary-button" onClick={openAdd}>
                <Plus size={16} /> Add First Product
              </button>
            }
          />
        )}

        {/* ── Server-Side Pagination Bar ── */}
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </Panel>

      {/* ── Add / Edit Product Modal ── */}
      {isAdding && (
        <Modal
          title={editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          icon={editingId ? Pencil : PackagePlus}
          onClose={() => {
            setIsAdding(false);
            setEditingId(null);
            setForm(blankForm);
          }}
          footer={
            <>
              <button
                className="secondary-button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
              <button className="primary-button" form="product-form" type="submit">
                {editingId ? 'Save Changes' : 'Create Product'}
              </button>
            </>
          }
        >
          <form id="product-form" className="modal-form" onSubmit={submitProduct}>
            <Field label="Product Name *" hint="Full descriptive title">
              <input
                required
                placeholder="e.g. Oxford Mathematical Geometry Set"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <div className="field-row">
              <Field label="SKU / Item Code" hint="Unique inventory ID">
                <input
                  placeholder="e.g. OXF-SET-001"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </Field>
              <Field label="Barcode / EAN" hint="Scannable barcode">
                <input
                  placeholder="e.g. 6161100223344"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                />
              </Field>
            </div>

            <div className="field-row">
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Brand / Publisher">
                <input
                  placeholder="e.g. Oxford, Bic, HP"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </Field>
            </div>

            <div className="field-row">
              <Field label="Shelf / Bin Location" hint="Where item is stored">
                <input
                  placeholder="e.g. Aisle 3, Shelf B"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </Field>
              <Field label="Unit of Measure">
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="reams">Reams</option>
                  <option value="boxes">Boxes</option>
                  <option value="cartons">Cartons</option>
                  <option value="sets">Sets</option>
                  <option value="rolls">Rolls</option>
                  <option value="packets">Packets</option>
                </select>
              </Field>
            </div>

            <div className="field-row">
              <Field label="Cost Price (KES)" hint="Purchase price">
                <input
                  type="number"
                  min="0"
                  value={form.buyingPrice}
                  onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                />
              </Field>
              <Field label="Retail Selling Price (KES)" hint={`Margin: ~${marginPct}%`}>
                <input
                  type="number"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                />
              </Field>
            </div>

            <div className="field-row">
              <Field label="Wholesale Price (KES)" hint="For bulk / school orders">
                <input
                  type="number"
                  min="0"
                  value={form.wholesalePrice}
                  onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                />
              </Field>
              <Field label="Current Stock Quantity">
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </Field>
            </div>

            <div className="field-row">
              <Field label="Reorder Alert Level" hint="Trigger low stock warning">
                <input
                  type="number"
                  min="0"
                  value={form.reorderLevel}
                  onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                />
              </Field>
              <Field label="Max Target Level" hint="Capacity limit">
                <input
                  type="number"
                  min="0"
                  value={form.maxLevel}
                  onChange={(e) => setForm({ ...form, maxLevel: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Preferred Supplier">
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">— Select Supplier (Optional) —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category || 'General'})</option>
                ))}
              </select>
            </Field>

            <Field label="Notes / Specifications">
              <input
                placeholder="Optional notes or supplier details..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* ── Stock In (Receive / Restock) Modal ── */}
      {restockItem && (
        <Modal
          title={`Stock In / Receive: ${restockItem.name}`}
          icon={Plus}
          onClose={() => setRestockItem(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setRestockItem(null)}>
                Cancel
              </button>
              <button className="primary-button" form="restock-form" type="submit">
                Receive Stock (+{restockQty})
              </button>
            </>
          }
        >
          <form id="restock-form" className="modal-form" onSubmit={submitRestock}>
            <p className="modal-note">
              Receiving goods increments on-hand quantity and logs a positive Stock In movement in the audit trail.
            </p>

            <div className="restock-item-summary">
              <div>
                <span>Current On Hand:</span>
                <strong>{number(restockItem.quantity)} {restockItem.unit}</strong>
              </div>
              <div>
                <span>New Expected Balance:</span>
                <strong className="text-positive">
                  {number(Number(restockItem.quantity) + Number(restockQty))} {restockItem.unit}
                </strong>
              </div>
            </div>

            <Field label="Quantity Received *" hint="Units added to inventory">
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
              />
            </Field>

            <Field label="Reason / Invoice Reference">
              <input
                placeholder="e.g. Delivery Batch #PO-8821 from Supplier"
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* ── Stock Out (Issue Goods / Dispatch / Damage) Modal ── */}
      {stockOutItem && (
        <Modal
          title={`Issue / Stock Out: ${stockOutItem.name}`}
          icon={Minus}
          onClose={() => setStockOutItem(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setStockOutItem(null)}>
                Cancel
              </button>
              <button
                className="danger-button"
                form="stockout-form"
                type="submit"
                disabled={Number(stockOutQty) <= 0 || Number(stockOutQty) > Number(stockOutItem.quantity)}
              >
                Confirm Stock Out (−{stockOutQty})
              </button>
            </>
          }
        >
          <form id="stockout-form" className="modal-form" onSubmit={submitStockOut}>
            <p className="modal-note">
              Issuing goods decrements the inventory balance and creates an auditable record of where and why stock went out.
            </p>

            <div className="restock-item-summary">
              <div>
                <span>Current Stock:</span>
                <strong>{number(stockOutItem.quantity)} {stockOutItem.unit}</strong>
              </div>
              <div>
                <span>Remaining Balance:</span>
                <strong className={Number(stockOutItem.quantity) - Number(stockOutQty) <= Number(stockOutItem.reorderLevel) ? 'text-warning' : 'text-positive'}>
                  {number(Math.max(0, Number(stockOutItem.quantity) - Number(stockOutQty)))} {stockOutItem.unit}
                </strong>
              </div>
            </div>

            <Field label="Quantity to Issue / Remove *" hint={`Max available: ${stockOutItem.quantity}`}>
              <input
                type="number"
                min="1"
                max={Number(stockOutItem.quantity)}
                required
                value={stockOutQty}
                onChange={(e) => setStockOutQty(e.target.value)}
              />
            </Field>

            <Field label="Reason / Category *">
              <select
                value={stockOutReasonType}
                onChange={(e) => setStockOutReasonType(e.target.value)}
              >
                {STOCK_OUT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>

            <Field label="Reference / Customer / Destination Details" hint="e.g. Invoice #102, St. Peters School, Damaged in transport">
              <input
                placeholder="Details of the outflow..."
                value={stockOutNote}
                onChange={(e) => setStockOutNote(e.target.value)}
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* ── Deactivate Confirmation Modal ── */}
      {confirmId && (
        <Modal
          title="Deactivate Inventory Item"
          onClose={() => setConfirmId(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  onDeactivateProduct(confirmId);
                  setConfirmId(null);
                }}
              >
                Deactivate Item
              </button>
            </>
          }
        >
          <p className="modal-note">
            Are you sure you want to deactivate this item? It will be hidden from the active catalog, but all historical stock movements and records will be preserved.
          </p>
        </Modal>
      )}

      {/* ── Bulk CSV Import Modal ── */}
      {showImportModal && (
        <BulkImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={onImportCsv}
        />
      )}
    </section>
  );
}