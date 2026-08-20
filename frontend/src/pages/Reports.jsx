import { BarChart3, Boxes, FileText, Printer, ReceiptText, ShoppingCart } from 'lucide-react';
import { Panel } from '../components/Panel';
import { TransactionList } from '../components/TransactionList';
import { money } from '../lib/format';

export function Reports({ dashboard, products, sales }) {
  const totalStockValue = products.reduce((sum, product) => sum + Number(product.quantity) * Number(product.buyingPrice), 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const productSales = sales.filter((sale) => sale.type === 'product').length;
  const serviceSales = sales.filter((sale) => sale.type === 'service').length;

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <article className="metric-card"><FileText size={23} /><span>Total Revenue</span><strong>{money(totalRevenue)}</strong></article>
        <article className="metric-card"><Boxes size={23} /><span>Inventory Value</span><strong>{money(totalStockValue)}</strong></article>
        <article className="metric-card"><ShoppingCart size={23} /><span>Product Sales</span><strong>{productSales}</strong></article>
        <article className="metric-card"><Printer size={23} /><span>Service Sales</span><strong>{serviceSales}</strong></article>
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
