import { query } from '../db.js';

/**
 * Returns the same aggregated shape the frontend computes in App.jsx's
 * buildDashboard(), so the UI can call this endpoint instead. The frontend
 * can also keep computing this locally from /products + /sales — this route
 * exists for parity and for future client architectures.
 */
export async function getDashboard(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { rows: products } = await query('select * from products order by created_at desc');
    const { rows: sales } = await query('select * from sales order by created_at desc');

    const todaysSales = sales.filter((sale) => String(sale.created_at).slice(0, 10) === today);
    const lowStock = products.filter((product) => Number(product.quantity) <= Number(product.reorder_level));

    const bestSellerMap = {};
    sales.forEach((sale) => {
      bestSellerMap[sale.item_name] ||= { name: sale.item_name, quantity: 0, revenue: 0 };
      bestSellerMap[sale.item_name].quantity += Number(sale.quantity);
      bestSellerMap[sale.item_name].revenue += Number(sale.total);
    });

    res.json({
      mode: 'mysql',
      totals: {
        products: products.length,
        lowStock: lowStock.length,
        todaySales: todaysSales.length,
        revenue: todaysSales.reduce((sum, sale) => sum + Number(sale.total), 0),
        profit: todaysSales.reduce(
          (sum, sale) => sum + (Number(sale.unit_price) - Number(sale.cost_price || 0)) * Number(sale.quantity),
          0
        ),
        expenses: 0,
        inventoryValue: products.reduce((sum, product) => sum + Number(product.quantity) * Number(product.buying_price), 0)
      },
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: Number(p.quantity),
        unit: p.unit,
        reorderLevel: Number(p.reorder_level)
      })),
      bestSellers: Object.values(bestSellerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
}