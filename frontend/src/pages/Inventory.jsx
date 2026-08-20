import { useState } from 'react';
import { Boxes, PackagePlus, Search } from 'lucide-react';
import { Panel } from '../components/Panel';
import { money } from '../lib/format';

const initialForm = {
  name: '',
  category: 'Stationery',
  unit: 'pcs',
  quantity: 1,
  reorderLevel: 10,
  buyingPrice: 0,
  sellingPrice: 0,
  sku: ''
};

export function Inventory({ products, onAddProduct }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initialForm);
  const filtered = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));

  const submit = async (event) => {
    event.preventDefault();
    await onAddProduct({
      ...form,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice)
    });
    setForm(initialForm);
  };

  return (
    <section className="split-view">
      <Panel title="Inventory" icon={Boxes} className="wide-panel">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stock item" />
        </label>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Cost</th><th>Price</th><th>Margin</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><span>{product.sku}</span></td>
                  <td>{product.quantity} {product.unit}</td>
                  <td>{money(product.buyingPrice)}</td>
                  <td>{money(product.sellingPrice)}</td>
                  <td>{money(product.sellingPrice - product.buyingPrice)}</td>
                  <td>
                    <span className={product.quantity <= product.reorderLevel ? 'badge danger' : 'badge'}>
                      {product.quantity <= product.reorderLevel ? 'Low' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Add Product" icon={PackagePlus}>
        <form className="form-grid" onSubmit={submit}>
          <input required placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input placeholder="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            <option>Books</option><option>Stationery</option><option>Printing</option><option>Cyber</option><option>Office</option>
          </select>
          <input placeholder="Unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          <input type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
          <input type="number" min="0" placeholder="Low stock level" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} />
          <input type="number" min="0" placeholder="Buying price" value={form.buyingPrice} onChange={(event) => setForm({ ...form, buyingPrice: event.target.value })} />
          <input type="number" min="0" placeholder="Selling price" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} />
          <button className="primary-button" type="submit">Add product</button>
        </form>
      </Panel>
    </section>
  );
}
