import { useState } from 'react';
import { Boxes, PackagePlus, Pencil, Plus, Search, X } from 'lucide-react';
import { Panel } from '../components/Panel';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { EmptyState } from '../components/EmptyState';
import { StockBadge, stockHealth } from '../components/StockBadge';
import { money, number } from '../lib/format';

const CATEGORIES = ['Books', 'Stationery', 'Printing', 'Cyber', 'Office'];
const STOCK_TABS = [
  ['all', 'All'],
  ['in', 'In stock'],
  ['low', 'Low'],
  ['out', 'Out']
];

const blankForm = {
  name: '',
  category: 'Stationery',
  unit: 'pcs',
  quantity: 1,
  reorderLevel: 10,
  buyingPrice: 0,
  sellingPrice: 0,
  sku: '',
  supplierId: ''
};

export function Inventory({ products, suppliers, onAddProduct, onUpdateProduct, onDeactivateProduct, onRestock }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [stockTab, setStockTab] = useState('all');
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState(1);
  const [confirmId, setConfirmId] = useState(null);

  const categories = ['All', ...new Set([...CATEGORIES, ...products.map((p) => p.category)])];

  const filtered = products.filter((product) => {
    const q = query.trim().toLowerCase();
    const matchQuery = !q || product.name.toLowerCase().includes(q) || String(product.sku || '').toLowerCase().includes(q);
    const matchCategory = category === 'All' || product.category === category;
    const matchStock = stockTab === 'all' || stockHealth(product).key === stockTab;
    return matchQuery && matchCategory && matchStock;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: Number(product.quantity),
      reorderLevel: Number(product.reorderLevel),
      buyingPrice: Number(product.buyingPrice),
      sellingPrice: Number(product.sellingPrice),
      sku: product.sku || '',
      supplierId: product.supplierId || ''
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      supplierId: form.supplierId || null
    };
    if (editingId) await onUpdateProduct(editingId, payload);
    else await onAddProduct(payload);
    setEditingId(null);
    setForm(blankForm);
  };

  const submitRestock = async (event) => {
    event.preventDefault();
    await onRestock(restockId, Number(restockQty));
    setRestockId(null);
    setRestockQty(1);
  };

  return (
    <section className="view-stack">
      <Panel title="Inventory" icon={Boxes} className="wide-panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or SKU" />
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="segmented">
            {STOCK_TABS.map(([key, label]) => (
              <button key={key} className={stockTab === key ? 'active' : ''} onClick={() => setStockTab(key)}>{label}</button>
            ))}
          </div>
          <button className="secondary-button" onClick={openAdd}><Plus size={17} /> Add</button>
        </div>
<div className="table-wrap">
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Cost</th><th>Price</th><th>Supplier</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <span>{product.sku || product.category}</span>
                  </td>
                  <td>{number(product.quantity)} {product.unit}</td>
                  <td>{money(product.buyingPrice)}</td>
                  <td>{money(product.sellingPrice)}</td>
                  <td>{product.supplierName || '—'}</td>
                  <td><StockBadge product={product} /></td>
                  <td className="table-actions">
                    <button className="icon-button" aria-label="Restock" title="Restock" onClick={() => { setRestockId(product.id); setRestockQty(1); }}>
                      <Plus size={15} />
                    </button>
                    <button className="icon-button" aria-label="Edit" title="Edit" onClick={() => openEdit(product)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-button danger" aria-label="Deactivate" title="Deactivate" onClick={() => setConfirmId(product.id)}>
                      <X size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={products.length ? 'No items match your filters' : 'No products yet'}
            hint={products.length ? 'Try a different search or filter.' : 'Add your first stock item to get started.'}
            action={products.length ? null : (
              <button className="secondary-button" onClick={openAdd}>Add your first item</button>
            )}
          />
        ) : null}
      </Panel>
{(editingId !== null || form.name !== '') ? (
        <Modal
          title={editingId ? 'Edit item' : 'Add product'}
          icon={editingId ? Pencil : PackagePlus}
          onClose={() => { setEditingId(null); setForm(blankForm); }}
          footer={<button className="primary-button" form="product-form" type="submit">{editingId ? 'Save changes' : 'Add to inventory'}</button>}
        >
          <form id="product-form" className="modal-form" onSubmit={submit}>
            <Field label="Product name"><input required placeholder="e.g. A4 Ruled Exercise Book" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <div className="field-row">
              <Field label="SKU"><input placeholder="Optional" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <div className="field-row">
              <Field label="Buying price (KES)" hint="What you pay"><input type="number" min="0" value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} /></Field>
              <Field label="Selling price (KES)" hint="What customers pay"><input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></Field>
            </div>
            <div className="field-row">
              <Field label="Quantity on hand" hint="Set to 0 and use Restock to log a movement"><input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
              <Field label="Low-stock alert level" hint="When to flag this item"><input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></Field>
            </div>
            <div className="field-row">
              <Field label="Unit"><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
              <Field label="Supplier">
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">— None —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          </form>
        </Modal>
      ) : null}

      {restockId ? (
        <Modal
          title="Restock / receive goods"
          icon={Plus}
          onClose={() => setRestockId(null)}
          footer={<button className="primary-button" form="restock-form" type="submit">Add stock</button>}
        >
          <form id="restock-form" className="modal-form" onSubmit={submitRestock}>
            <p className="modal-note">Receiving stock creates a recorded stock-in movement and raises the on-hand quantity.</p>
            <Field label="Quantity received"><input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} /></Field>
          </form>
        </Modal>
      ) : null}

      {confirmId ? (
        <Modal
          title="Deactivate item"
          onClose={() => setConfirmId(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="danger-button" onClick={() => { onDeactivateProduct(confirmId); setConfirmId(null); }}>Deactivate</button>
            </>
          }
        >
          <p className="modal-note">This removes the item from active inventory views but keeps its sales and movement history intact.</p>
        </Modal>
      ) : null}
    </section>
  );
}