import { AlertTriangle, BarChart3, Boxes, CircleDollarSign, ReceiptText, WalletCards } from 'lucide-react';
import { Panel } from '../components/Panel';
import { TransactionList } from '../components/TransactionList';
import { money } from '../lib/format';

export function Dashboard({ dashboard, sales }) {
  const totals = dashboard?.totals || {};
  const stats = [
    ['Total Products', totals.products, Boxes],
    ['Low Stock Items', totals.lowStock, AlertTriangle],
    ["Today's Revenue", money(totals.revenue), CircleDollarSign],
    ["Today's Profit", money(totals.profit), WalletCards]
  ];

  return (
    <section className="view-stack">
      <div className="metric-grid">
        {stats.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <Icon size={23} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel title="Low Stock Alerts" icon={AlertTriangle}>
          <div className="alert-list">
            {dashboard?.lowStock?.map((item) => (
              <div className="alert-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} {item.unit} remaining</span>
                </div>
                <b>Min {item.reorderLevel}</b>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Transactions" icon={ReceiptText}>
          <TransactionList sales={sales.slice(0, 7)} />
        </Panel>
      </div>
      <Panel title="Best Sellers" icon={BarChart3}>
        <div className="bar-list">
          {dashboard?.bestSellers?.map((item) => (
            <div className="bar-row" key={item.name}>
              <span>{item.name}</span>
              <div><i style={{ width: `${Math.min(100, item.quantity * 18)}%` }} /></div>
              <b>{money(item.revenue)}</b>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
