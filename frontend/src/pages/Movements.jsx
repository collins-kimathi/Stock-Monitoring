import { useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, History,
  Search, SlidersHorizontal
} from 'lucide-react';
import { Panel } from '../components/Panel';
import { EmptyState } from '../components/EmptyState';
import { number, dateTime } from '../lib/format';

const TYPE_META = {
  stock_in:   { label: 'Stock in',    class: 'move-in' },
  stock_out:  { label: 'Stock out',   class: 'move-out' },
  adjustment: { label: 'Adjustment',  class: 'move-adjust' }
};

export function Movements({ movements, products }) {
  const [query, setQuery]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = movements.filter((m) => {
    const q        = query.trim().toLowerCase();
    const matchQuery = !q || String(m.productName || '').toLowerCase().includes(q);
    const matchType  = typeFilter === 'all' || m.type === typeFilter;
    return matchQuery && matchType;
  });

  const totalIn  = filtered.filter((m) => m.quantity > 0)
    .reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalOut = filtered.filter((m) => m.quantity < 0)
    .reduce((sum, m) => sum + Math.abs(Number(m.quantity)), 0);

  return (
    <section className="view-stack">
      {/* Summary cards */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
        <article
          className="metric-card"
          style={{ '--card-accent': 'linear-gradient(90deg,#10b981,#34d399)' }}
        >
          <div
            className="metric-icon"
            style={{ '--icon-bg': 'rgba(16,185,129,0.15)', '--icon-color': '#34d399' }}
          >
            <ArrowUpFromLine size={20} />
          </div>
          <span>Stock received</span>
          <strong>+{number(totalIn)}</strong>
        </article>

        <article
          className="metric-card"
          style={{ '--card-accent': 'linear-gradient(90deg,#ef4444,#f87171)' }}
        >
          <div
            className="metric-icon"
            style={{ '--icon-bg': 'rgba(239,68,68,0.15)', '--icon-color': '#f87171' }}
          >
            <ArrowDownToLine size={20} />
          </div>
          <span>Stock moved out</span>
          <strong>−{number(totalOut)}</strong>
        </article>

        <article
          className="metric-card"
          style={{ '--card-accent': 'linear-gradient(90deg,#6366f1,#818cf8)' }}
        >
          <div
            className="metric-icon"
            style={{ '--icon-bg': 'rgba(99,102,241,0.15)', '--icon-color': '#818cf8' }}
          >
            <SlidersHorizontal size={20} />
          </div>
          <span>Events logged</span>
          <strong>{number(filtered.length)}</strong>
        </article>
      </div>

      {/* Audit log table */}
      <Panel title="Movement & audit history" icon={History}>
        <div className="toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product"
            />
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
              <tr>
                <th>When</th>
                <th>Item</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const meta     = TYPE_META[m.type] || { label: m.type, class: 'move-adjust' };
                const positive = Number(m.quantity) > 0;
                return (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                      {dateTime(m.createdAt)}
                    </td>
                    <td>
                      <strong>{m.productName || 'Deleted item'}</strong>
                      <span>{m.referenceType || 'manual'}</span>
                    </td>
                    <td>
                      <span className={`movement-badge ${meta.class}`}>{meta.label}</span>
                    </td>
                    <td className={positive ? 'num-positive' : 'num-negative'}>
                      {positive ? '+' : ''}{number(m.quantity)}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                      {m.reason || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={movements.length ? 'No movements match' : 'No stock movements yet'}
            hint={
              movements.length
                ? 'Adjust filters or search.'
                : 'Every restock, sale and adjustment you make will be logged here for a full audit trail.'
            }
          />
        ) : null}
      </Panel>
    </section>
  );
}