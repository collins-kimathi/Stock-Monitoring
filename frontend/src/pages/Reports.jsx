import { BarChart3, Boxes, DollarSign, Layers, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import { Panel } from '../components/Panel';
import { EmptyState } from '../components/EmptyState';
import { money, number } from '../lib/format';

export function Reports({ dashboard, products }) {
  const summary = dashboard?.summary || {};
  const totalCost = summary.totalCostValue || products.reduce((sum, p) => sum + (Number(p.quantity || 0) * Number(p.buyingPrice || 0)), 0);
  const totalRetail = summary.totalRetailValue || products.reduce((sum, p) => sum + (Number(p.quantity || 0) * Number(p.sellingPrice || 0)), 0);
  const potentialProfit = totalRetail - totalCost;
  const totalUnits = summary.totalUnits || products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const totalSkus = summary.totalSkus || products.length || 0;
  const marginPct = totalRetail > 0 ? (((totalRetail - totalCost) / totalRetail) * 100).toFixed(1) : 0;

  // Calculate category breakdowns from real products
  const categoryMap = {};
  products.forEach((p) => {
    const cat = p.category || 'Other';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, count: 0, units: 0, costVal: 0, retailVal: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].units += Number(p.quantity || 0);
    categoryMap[cat].costVal += Number(p.quantity || 0) * Number(p.buyingPrice || 0);
    categoryMap[cat].retailVal += Number(p.quantity || 0) * Number(p.sellingPrice || 0);
  });
  const categoryList = Object.values(categoryMap).sort((a, b) => b.costVal - a.costVal);

  const kpis = [
    {
      label: 'Inventory Value (Cost)',
      value: money(totalCost),
      hint: 'Actual capital in stock',
      Icon: Wallet,
      accent: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
      iconBg: 'rgba(124,58,237,0.15)',
      iconColor: '#a78bfa'
    },
    {
      label: 'Potential Retail Value',
      value: money(totalRetail),
      hint: 'Gross realizable sales value',
      Icon: DollarSign,
      accent: 'linear-gradient(90deg, #10b981, #34d399)',
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: '#34d399'
    },
    {
      label: 'Est. Gross Margin',
      value: money(potentialProfit),
      hint: `Average margin: ${marginPct}%`,
      Icon: TrendingUp,
      accent: 'linear-gradient(90deg, #6366f1, #818cf8)',
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#818cf8'
    },
    {
      label: 'Total Stock Volume',
      value: number(totalUnits),
      hint: `Spread across ${number(totalSkus)} active SKUs`,
      Icon: Boxes,
      accent: 'linear-gradient(90deg, #06b6d4, #38bdf8)',
      iconBg: 'rgba(6,182,212,0.15)',
      iconColor: '#38bdf8'
    }
  ];

  return (
    <section className="view-stack">
      {/* ── KPI Summary Cards ── */}
      <div className="metric-grid">
        {kpis.map((item) => (
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

      {/* ── Category Valuation Breakdown Table ── */}
      <Panel title="Valuation Breakdown by Category" icon={Layers}>
        {categoryList.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>SKUs</th>
                  <th>Units on Hand</th>
                  <th>Cost Valuation (KES)</th>
                  <th>Retail Valuation (KES)</th>
                  <th>Est. Margin %</th>
                  <th>% of Inventory Capital</th>
                </tr>
              </thead>
              <tbody>
                {categoryList.map((cat) => {
                  const sharePct = totalCost > 0 ? ((cat.costVal / totalCost) * 100).toFixed(1) : 0;
                  const catMargin = cat.retailVal > 0 ? (((cat.retailVal - cat.costVal) / cat.retailVal) * 100).toFixed(1) : 0;
                  return (
                    <tr key={cat.name}>
                      <td><strong>{cat.name}</strong></td>
                      <td>{cat.count}</td>
                      <td>{number(cat.units)}</td>
                      <td>{money(cat.costVal)}</td>
                      <td>{money(cat.retailVal)}</td>
                      <td className="text-positive">+{catMargin}%</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{sharePct}%</span>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, sharePct)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #34d399)' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No inventory valuation data"
            hint="Valuation reports will automatically populate as real stock items are entered into the system."
          />
        )}
      </Panel>
    </section>
  );
}
