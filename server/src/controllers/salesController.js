import { query } from '../db.js';
import { recordSale } from '../services/stockService.js';
import { ApiError } from '../middleware/errorHandler.js';

// Frontend (Sales.jsx, Dashboard.jsx, TransactionList.jsx, Reports.jsx) expects
// camelCase: itemName/unitPrice/costPrice/paymentMethod/type/createdAt/total.
function toApiSale(row) {
  if (!row) return row;
  return {
    id: row.id,
    type: row.type,
    productId: row.product_id,
    itemName: row.item_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    costPrice: Number(row.cost_price),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    staffId: row.staff_id,
    createdAt: row.created_at
  };
}

export async function listSales(req, res, next) {
  try {
    const { rows } = await query('select * from sales order by created_at desc');
    res.json(rows.map(toApiSale));
  } catch (error) {
    next(error);
  }
}

export async function getSale(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query('select * from sales where id = $1', [id]);
    if (!rows[0]) throw new ApiError(404, `Sale ${id} not found`);
    res.json(toApiSale(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function createSale(req, res, next) {
  try {
    const sale = await recordSale(req.body || {});
    res.status(201).json(toApiSale(sale));
  } catch (error) {
    next(error);
  }
}

export async function listProductSales(req, res, next) {
  try {
    const { rows } = await query("select * from sales where type = 'product' order by created_at desc");
    res.json(rows.map(toApiSale));
  } catch (error) {
    next(error);
  }
}