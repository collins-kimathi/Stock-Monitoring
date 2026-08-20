import {
  AlertTriangle, Boxes, CheckCircle2, DollarSign,
  PackageX, ShieldAlert, TrendingUp, Wallet, ArrowRight,
  Layers, MapPin, Truck
} from 'lucide-react';
import { Panel } from '../components/Panel';
import { EmptyState } from '../components/EmptyState';
import { StockBadge } from '../components/StockBadge';
import { money, number } from '../lib/format';

export function Dashboard({ summary, products, movements, onNavigate }) {
  const s = summary || {};
  const totalSkus = s.totalSkus || products.length || 0;
  const totalUnits = s.totalUnits || products.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
  const totalCostValue = s.totalCostValue || products.reduce((acc, p) => acc + (Number(p.quantity || 0) * Number(p.buyingPrice || 0)), 0);
  const totalRetailValue = s.totalRetailValue || products.reduce((acc, p) => acc + (Number(p.quantity || 0) * Number(p.sellingPrice || 0)), 0);
  const potentialProfit = totalRetailValue - totalCostValue;
  const lowStockCount = s.lowStockCount || products.filter(p => Number(p.quantity) <= Number(p.reorderLevel) && Number(p.quantity) > 0).length;
  const outOfStockCount = s.outOfStockCount || products.filter(p => Number(p.quantity) <= 0).length;
  const healthyStockCount = s.healthyStockCount || products.filter(p => Number(p.quantity) > Number(p.reorderLevel)).length;

  const lowStockItems = products.filter(p => Number(p.quantity) <= Number(p.reorderLevel));
  const recentMovements = (movements || []).slice(0, 5);

  const stats = [
    {
      label: 'Total Active SKUs',
      value: number(totalSkus),
      hint: `${number(totalUnits)} units in stock`,
      Icon: Boxes,
      accent: 'linear-gradient(90deg, #6366f1, #818cf8)',
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#818cf8'
    },
    {
      label: 'Inventory Valuation (Cost)',
      value: money(totalCostValue),
      hint: 'Capital invested in stock',
      Icon: Wallet,
      accent: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
      iconBg: 'rgba(124,58,237,0.15)',
      iconColor: '#a78bfa'
    },
    {
      label: 'Potential Retail Value',
      value: money(totalRetailValue),
      hint: `Est. Gross Profit: ${money(potentialProfit)}`,
      Icon: DollarSign,
      accent: 'linear-gradient(90deg, #10b981, #34d399)',
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: '#34d399'
    },
    {
      label: 'Low Stock Alerts',
      value: number(lowStockCount),
      hint: 'Items at or below reorder level',
      Icon: AlertTriangle,
      accent: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#fbbf24'
    },
    {
      label: 'Out of Stock',
      value: number(outOfStockCount),
      hint: 'Requires immediate replenishment',
      Icon: PackageX,
      accent: 'linear-gradient(90deg, #ef4444, #f87171)',
      iconBg: 'rgba(239,68,68,0.15)',
      iconColor: '#f87171'
    },
    {
      label: 'Healthy Stock Items',
      value: number(healthyStockCount),
      hint: 'Adequately stocked',
      Icon: CheckCircle2,
      accent: 'linear-gradient(90deg, #06b6d4, #38bdf8)',
      iconBg: 'rgba(6,182,212,0.15)',
      iconColor: '#38bdf8'
    }
  ];

  return (
    <section className="view-stack">
      {/* ── KPI Metrics Grid ── */}
      <div className="metric-grid">
        {stats.map((item) => (
          <article
            className="metric-card"
            key={item.label}
            style={{ '--card-accent': item.accent }}
          >
            <div
              className="metric-icon"
              style={{ '--icon-bg': item.iconBg, '--icon-color': item.iconColor }}
            >
              <item.Icon size={20} />
            </div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small className="metric-hint">{item.hint}</small>
          </article>
        ))}
      </div>

      {/* ── Dashboard Split Grid ── */}
      <div className="dashboard-grid">
        {/* Low Stock Warning Panel */}
        <Panel title="Critical Reorder Alerts" icon={AlertTriangle}>
          {lowStockItems.length > 0 ? (
            <div className="alert-list">
              {lowStockItems.slice(0, 6).map((item) => (
                <div className="alert-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {Number(item.quantity)} {item.unit} on hand (Reorder threshold: {item.reorderLevel})
                    </span>
                  </div>
                  <StockBadge product={item} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="All stock levels healthy"
              hint="No items are currently below their designated reorder threshold."
            />
          )}

          <div style={{ marginTop: 14 }}>
            <button
              className="secondary-button"
              onClick={() => onNavigate('inventory')}
            >
              <span>View Full Inventory Catalog</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </Panel>

        {/* Recent Stock Movements / Audit */}
        <Panel title="Recent Stock Activity" icon={TrendingUp}>
          {recentMovements.length > 0 ? (
            <div className="transaction-list">
              {recentMovements.map((m) => {
                const positive = Number(m.quantity) > 0;
                return (
                  <div className="transaction-row" key={m.id}>
                    <div>
                      <strong>{m.productName || 'Stock Movement'}</strong>
                      <span>{m.reason || m.type}</span>
                    </div>
                    <b className={positive ? 'num-positive' : 'num-negative'}>
                      {positive ? '+' : ''}{number(m.quantity)}
                    </b>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No recent stock movements"
              hint="Restocks, adjustments, and receipts will be recorded here."
            />
          )}

          <div style={{ marginTop: 14 }}>
            <button
              className="secondary-button"
              onClick={() => onNavigate('movements')}
            >
              <span>View Stock Audit Log</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </Panel>
      </div>

      {/* ── Category Valuation Breakdown ── */}
      {s.categories && s.categories.length > 0 && (
        <Panel title="Stock Valuation by Category" icon={Layers}>
          <div className="category-valuation-grid">
            {s.categories.map((c) => {
              const pct = totalCostValue > 0 ? Math.round((c.value / totalCostValue) * 100) : 0;
              return (
                <div className="cat-val-card" key={c.category}>
                  <div className="cat-val-head">
                    <strong>{c.category}</strong>
                    <span>{pct}% of inventory</span>
                  </div>
                  <div className="cat-val-numbers">
                    <b>{money(c.value)}</b>
                    <small>{number(c.units)} units ({c.count} SKUs)</small>
                  </div>
                  <div className="cat-val-bar">
                    <div style={{ width: `${Math.min(100, Math.max(3, pct))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </section>
  );
}