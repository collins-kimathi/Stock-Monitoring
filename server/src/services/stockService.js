import { pool, withTransaction } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

const MOVEMENT_TYPES = ['stock_in', 'stock_out', 'adjustment'];

/**
 * Core signed stock mutation. Locks the product row, verifies the balance can
 * never go negative, writes an audit movement row and returns the new balance
 * — all atomically. `client` lets callers share the sale's transaction; when
 * omitted a fresh transaction is opened and committed.
 *
 * type:
 *   stock_in   -> +quantity (received from supplier / restock)
 *   stock_out  -> -quantity (sold / used / issued)
 *   adjustment -> quantity may be signed (manual correction up or down)
 */
export async function moveStock(
  { productId, type, quantity, reason = '', referenceType = null, referenceId = null, createdBy = null },
  client
) {
  if (!MOVEMENT_TYPES.includes(type)) throw new ApiError(400, `type must be one of ${MOVEMENT_TYPES.join(', ')}`);
  if (!productId) throw new ApiError(400, 'productId is required');

  let signed = Number(quantity);
  if (!Number.isFinite(signed) || signed === 0) throw new ApiError(400, 'quantity must be a non-zero number');

  if (type === 'stock_in') signed = Math.abs(signed);
  if (type === 'stock_out') signed = -Math.abs(signed);

    const run = async (db) => {
    const { rows } = await db.query('select id, quantity from products where id = $1 for update', [productId]);
    const product = rows[0];
    if (!product) throw new ApiError(404, `Product ${productId} not found`);

    const next = Number(product.quantity) + signed;
    if (next < 0) {
      throw new ApiError(400, `Insufficient stock: only ${Number(product.quantity)} available`);
    }

    await db.query('update products set quantity = $1 where id = $2', [next, productId]);
    const movement = (await db.query(
      `insert into stock_movements (product_id, type, quantity, reason, reference_type, reference_id, created_by)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [productId, type, signed, reason || '', referenceType, referenceId, createdBy]
    )).rows[0];
    return { next, movement };
  };

  if (client) return run(client);

  return withTransaction(async (db) => {
    const result = await run(db);
    return result;
  });
}

/**
 * Records a sale and, for physical products, decrements stock + writes a
 * movement row atomically in one transaction. Throws 400 if stock would go
 * negative.
 */
export async function recordSale(payload) {
  const {
    type = 'product',
    productId = null,
    itemName,
    quantity,
    unitPrice,
    costPrice = 0,
    paymentMethod = 'Cash',
    staffId = null
  } = payload;

  if (!itemName) throw new ApiError(400, 'itemName is required');
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new ApiError(400, 'quantity must be a positive number');

  return withTransaction(async (client) => {
    let resolvedProductId = productId;

    if (type === 'product') {
      if (!productId) throw new ApiError(400, 'productId is required for product sales');
      await moveStock(
        { productId, type: 'stock_out', quantity: qty, reason: 'Sale', referenceType: 'sale', createdBy: staffId },
        client
      );
      resolvedProductId = productId;
    }

    const insert = await client.query(
      `insert into sales (type, product_id, item_name, quantity, unit_price, cost_price, payment_method, staff_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [type, resolvedProductId, itemName, qty, Number(unitPrice) || 0, Number(costPrice) || 0, paymentMethod, staffId]
    );

    return insert.rows[0];
  });
}

/**
 * Products at/below their reorder level — drives the dashboard low-stock panel.
 */
export async function getLowStockProducts() {
  const { rows } = await pool.query(
    'select * from products where is_active = true and quantity <= reorder_level order by quantity asc'
  );
  return rows;
}
