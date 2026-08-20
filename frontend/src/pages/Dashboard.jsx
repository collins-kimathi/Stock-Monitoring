import {
  AlertTriangle, BarChart3, Boxes, PackageX, ReceiptText,
  TrendingUp, Wallet, DollarSign
} from 'lucide-react';
import { Panel } from '../components/Panel';
import { TransactionList } from '../components/TransactionList';
import { EmptyState } from '../components/EmptyState';
import { money } from '../lib/format';

// Each card: [label, value, Icon, accent gradient, icon bg colour, icon text colour]
function buildStats(totals, outOfStock) {
  return [
    [
      'Total Products', totals.products, Boxes,
      'linear-gradient(90deg,#6366f1,#818cf8)',
      'rgba(99,102,241,0.15)', '#818cf8'
    ],
    [
      'Stock Value', money(totals.inventoryValue), Wallet,
      'linear-gradient(90deg,#7c3aed,#a78bfa)',
      'rgba(124,58,237,0.15)', '#a78bfa'
    ],
    [
      'Low Stock Items', totals.lowStock, AlertTriangle,
      'linear-gradient(90deg,#f59e0b,#fbbf24)',
      'rgba(245,158,11,0.15)', '#fbbf24'
    ],
    [
      'Out of Stock', outOfStock, PackageX,
      'linear-gradient(90deg,#ef4444,#f87171)',
      'rgba(239,68,68,0.15)', '#f87171'
    ],
    [
      "Today's Revenue", money(totals.revenue), DollarSign,
      'linear-gradient(90deg,#10b981,#34d399)',
      'rgba(16,185,129,0.15)', '#34d399'
    ],
    [
      "Today's Profit", money(totals.profit), TrendingUp,
      'linear-gradient(90deg,#06b6d4,#38bdf8)',
      'rgba(6,182,212,0.15)', '#38bdf8'
    ],
  ];
}

export function Dashboard({ dashboard, sales, products, onNavigate }) {
  const totals = dashboard?.totals || {};
  const outOfStock = products.filter((p) => Number(p.quantity) === 0).length;
  const stats = buildStats(totals, outOfStock);

  const maxRevenue = Math.max(1, ...(dashboard?.bestSellers || []).map((s) => s.revenue));

  return (
    <section className="view-stack">
      {/* ── Metric cards ── */}
      <div className="metric-grid">
        {stats.map(([label, value, Icon, accent, iconBg, iconColor]) => (
          <article
            className="metric-card"
            key={label}
            style={{ '--card-accent': accent }}
          >
            <div
              className="metric-icon"
              style={{ '--icon-bg': iconBg, '--icon-color': iconColor }}
            >
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </article>
        ))}
      </div>

      {/* ── Dashboard grid ── */}
      <div className="dashboard-grid">
        <Panel title="Low Stock Alerts" icon={AlertTriangle}>
          {dashboard?.lowStock?.length ? (
            <div className="alert-list">
              {dashboard.lowStock.map((item) => (
                <div className="alert-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {Number(item.quantity)} {item.unit} remaining
                      (min {Number(item.reorderLevel)})
                    </span>
                  </div>
                  <b>⚠ Restock</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No low-stock alerts"
              hint="All active items are above their reorder level."
            />
          )}
          {dashboard?.lowStock?.length ? (
            <button
              className="secondary-button"
              style={{ marginTop: 14 }}
              onClick={() => onNavigate('inventory')}
            >
              Manage inventory
            </button>
          ) : null}
        </Panel>

        <Panel title="Recent Transactions" icon={ReceiptText}>
          {sales.length ? (
            <TransactionList sales={sales.slice(0, 6)} />
          ) : (
            <EmptyState
              title="No sales yet"
              hint="Record a sale on the Sales screen and it will appear here."
            />
          )}
        </Panel>
      </div>

      {/* ── Best sellers bar chart ── */}
      <Panel title="Best Sellers" icon={BarChart3}>
        {dashboard?.bestSellers?.length ? (
          <div className="bar-list">
            {dashboard.bestSellers.map((item) => {
              const pct = Math.max(4, Math.round((item.revenue / maxRevenue) * 100));
              return (
                <div className="bar-row" key={item.name}>
                  <span title={item.name}>{item.name}</span>
                  <div>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <b>{money(item.revenue)}</b>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No sales data yet"
            hint="Best sellers will appear once you record sales."
          />
        )}
      </Panel>
    </section>
  );
}