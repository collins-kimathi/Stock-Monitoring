import { query } from '../db.js';
import { moveStock } from '../services/stockService.js';
import { ApiError } from '../middleware/errorHandler.js';

// Frontend expects camelCase + a productName join for the audit log.
function toApiMovement(row) {
  if (!row) return row;
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantity: Number(row.quantity),
    reason: row.reason,
    referenceType: row.reference_type,
    createdAt: row.created_at
  };
}

export async function listMovements(req, res, next) {
  try {
    const { productId, type } = req.query;
    const clauses = [];
    const values = [];

    if (productId) {
      values.push(productId);
      clauses.push(`m.product_id = $${values.length}`);
    }
    if (type && ['stock_in', 'stock_out', 'adjustment'].includes(type)) {
      values.push(type);
      clauses.push(`m.type = $${values.length}`);
    }

    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const { rows } = await query(
      `select m.*, p.name as product_name
       from stock_movements m
       left join products p on p.id = m.product_id
       ${where}
       order by m.created_at desc, m.id desc
       limit 200`,
      values
    );
    res.json(rows.map(toApiMovement));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/movements
 * body: { productId, type, quantity, reason }
 */
export async function createMovement(req, res, next) {
  try {
    const { productId, type, quantity, reason } = req.body || {};
    if (!productId) throw new ApiError(400, 'productId is required');
    if (!type) throw new ApiError(400, 'type is required (stock_in | stock_out | adjustment)');
    if (quantity === undefined || quantity === null || Number(quantity) === 0) {
      throw new ApiError(400, 'quantity must be a non-zero number');
    }

    const { movement, next } = await moveStock({ productId, type, quantity, reason });
    const productName = await query('select name from products where id = $1', [productId]).then((r) => r.rows[0]?.name);

    res.status(201).json({ ...toApiMovement(movement), productName, balance: Number(next) });
  } catch (error) {
    next(error);
  }
}