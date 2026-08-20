import { BarChart3, Boxes, FileText, Printer, ReceiptText, ShoppingCart } from 'lucide-react';
import { Panel } from '../components/Panel';
import { TransactionList } from '../components/TransactionList';
import { money } from '../lib/format';

export function Reports({ dashboard, products, sales }) {
  const totalStockValue = products.reduce(
    (sum, p) => sum + Number(p.quantity) * Number(p.buyingPrice), 0
  );
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const productSales = sales.filter((s) => s.type === 'product').length;
  const serviceSales = sales.filter((s) => s.type === 'service').length;

  const cards = [
    {
      label: 'Total Revenue', value: money(totalRevenue), Icon: FileText,
      accent: 'linear-gradient(90deg,#10b981,#34d399)',
      iconBg: 'rgba(16,185,129,0.15)', iconColor: '#34d399'
    },
    {
      label: 'Inventory Value', value: money(totalStockValue), Icon: Boxes,
      accent: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
      iconBg: 'rgba(124,58,237,0.15)', iconColor: '#a78bfa'
    },
    {
      label: 'Product Sales', value: productSales, Icon: ShoppingCart,
      accent: 'linear-gradient(90deg,#6366f1,#818cf8)',
      iconBg: 'rgba(99,102,241,0.15)', iconColor: '#818cf8'
    },
    {
      label: 'Service Sales', value: serviceSales, Icon: Printer,
      accent: 'linear-gradient(90deg,#06b6d4,#38bdf8)',
      iconBg: 'rgba(6,182,212,0.15)', iconColor: '#38bdf8'
    },
  ];

  return (
    <section className="view-stack">
      <div className="metric-grid">
        {cards.map(({ label, value, Icon, accent, iconBg, iconColor }) => (
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
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <Panel title="Profit Leaders" icon={BarChart3}>
        <div className="report-grid">
          {dashboard?.bestSellers?.map((item) => (
            <div className="report-card" key={item.name}>
              <span>{item.quantity} sold</span>
              <strong>{item.name}</strong>
              <b>{money(item.revenue)}</b>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Latest Sales" icon={ReceiptText}>
        <TransactionList sales={sales} />
      </Panel>
    </section>
  );
}
