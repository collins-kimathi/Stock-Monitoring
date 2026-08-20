import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, History, Search, SlidersHorizontal } from 'lucide-react';
import { Panel } from '../components/Panel';
import { EmptyState } from '../components/EmptyState';
import { number, dateTime } from '../lib/format';

const TYPE_META = {
  stock_in: { label: 'Stock in', class: 'move-in' },
  stock_out: { label: 'Stock out', class: 'move-out' },
  adjustment: { label: 'Adjustment', class: 'move-adjust' }
};

export function Movements({ movements, products }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = movements.filter((m) => {
    const q = query.trim().toLowerCase();
    const matchQuery = !q || String(m.productName || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchQuery && matchType;
  });

  const totalIn = filtered.filter((m) => m.quantity > 0).reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalOut = filtered.filter((m) => m.quantity < 0).reduce((sum, m) => sum + Math.abs(Number(m.quantity)), 0);

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <article className="metric-card"><ArrowUpFromLine size={23} /><span>Stock received</span><strong>+{number(totalIn)}</strong></article>
        <article className="metric-card"><ArrowDownToLine size={23} /><span>Stock moved out</span><strong>−{number(totalOut)}</strong></article>
        <article className="metric-card"><SlidersHorizontal size={23} /><span>Events logged</span><strong>{number(filtered.length)}</strong></article>
      </div>

      <Panel title="Movement & audit history" icon={Search}>
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product" />
          </label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="stock_in">Stock in</option>
            <option value="stock_out">Stock out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Item</th><th>Type</th><th>Qty</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                                const meta = TYPE_META[m.type] || { label: m.type, class: 'move-adjust' };
                const positive = Number(m.quantity) > 0;
                return (
                  <tr key={m.id}>
                    <td>{dateTime(m.createdAt)}</td>
                    <td><strong>{m.productName || 'Deleted item'}</strong><span>{m.referenceType || 'manual'}</span></td>
                                        <td><span className={`movement-badge ${meta.class}`}>{meta.label}</span></td>
                    <td className={positive ? 'num-positive' : 'num-negative'}>{positive ? '+' : ''}{number(m.quantity)}</td>
                    <td>{m.reason || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={movements.length ? 'No movements match' : 'No stock movements yet'}
            hint={movements.length ? 'Adjust filters or search.' : 'Every restock, sale and adjustment you make will be logged here for a full audit trail.'}
          />
        ) : null}
      </Panel>
    </section>
  );
}