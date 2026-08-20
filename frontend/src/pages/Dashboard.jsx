import { AlertTriangle, BarChart3, PackageX, ReceiptText, WalletCards } from 'lucide-react';
import { Panel } from '../components/Panel';
import { TransactionList } from '../components/TransactionList';
import { EmptyState } from '../components/EmptyState';
import { money } from '../lib/format';

export function Dashboard({ dashboard, sales, products, onNavigate }) {
  const totals = dashboard?.totals || {};
  const outOfStock = products.filter((p) => Number(p.quantity) === 0).length;

  const stats = [
    ['Total Products', totals.products, 'package-open'],
    ['Stock Value', money(totals.inventoryValue), 'banknote'],
    ['Low Stock Items', totals.lowStock, 'alert'],
    ['Out of Stock', outOfStock, 'out'],
    ["Today's Revenue", money(totals.revenue), 'cash'],
    ["Today's Profit", money(totals.profit), 'wallet']
  ];

  const iconFor = (key, size) => {
    const base = { size, color: '#f87171' };
    switch (key) {
      case 'alert': return <AlertTriangle {...base} />;
      case 'out': return <PackageX {...base} />;
      case 'wallet': return <WalletCards {...base} />;
      case 'banknote': return <WalletCards {...base} />;
      case 'package-open': return <PackageX {...base} />;
      default: return <WalletCards {...base} />;
    }
  };

  return (
    <section className="view-stack">
      <div className="metric-grid">
        {stats.map(([label, value, icon]) => (
          <article className="metric-card" key={label}>
            {icon ? iconFor(icon, 23) : null}
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <Panel title="Low Stock Alerts" icon={AlertTriangle}>
          {dashboard?.lowStock?.length ? (
            <div className="alert-list">
              {dashboard.lowStock.map((item) => (
                <div className="alert-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{Number(item.quantity)} {item.unit} remaining (min {Number(item.reorderLevel)})</span>
                  </div>
                  <b>Restock</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No low-stock alerts" hint="All active items are above their reorder level." />
          )}
          {dashboard?.lowStock?.length ? (
            <button className="secondary-button" onClick={() => onNavigate('inventory')}>Manage inventory</button>
          ) : null}
        </Panel>

        <Panel title="Recent Transactions" icon={ReceiptText}>
          {sales.length ? <TransactionList sales={sales.slice(0, 6)} /> : (
            <EmptyState title="No sales yet" hint="Record a sale on the Sales screen and it will appear here." />
          )}
        </Panel>
      </div>

      <Panel title="Best Sellers" icon={BarChart3}>
        {dashboard?.bestSellers?.length ? (
          <div className="bar-list">
            {dashboard.bestSellers.map((item) => (
              <div className="bar-row" key={item.name}>
                <span>{item.name}</span>
                <div><i style={{ width: `${Math.min(100, item.quantity * 12)}%` }} /></div>
                <b>{money(item.revenue)}</b>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No sales data yet" hint="Best sellers will appear once you record sales." />
        )}
      </Panel>
    </section>
  );
}