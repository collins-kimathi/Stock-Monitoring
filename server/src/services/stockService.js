import { pool, withTransaction } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Records a sale and, if it is tied to a physical product, decrements stock
 * atomically inside one DB transaction. Throws a 400 ApiError if the sale
 * would push quantity below zero — this is the "don't let stock go negative"
 * rule from the project brief.
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

      // Lock the row so concurrent sales can't both pass the check and oversell stock.
      const { rows } = await client.query('select id, quantity from products where id = $1 for update', [productId]);
      const product = rows[0];
      if (!product) throw new ApiError(404, `Product ${productId} not found`);
      if (Number(product.quantity) < qty) {
        throw new ApiError(400, `Insufficient stock: only ${product.quantity} left`);
      }

      await client.query('update products set quantity = quantity - $1 where id = $2', [qty, productId]);
      resolvedProductId = product.id;
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
 * Returns products whose quantity has dropped to/below their reorder level.
 * Used for the dashboard low-stock banner and can later back an alerts route.
 */
export async function getLowStockProducts(client) {
  const runner = client || pool;
  const { rows } = await runner.query('select * from products where quantity <= reorder_level order by quantity asc');
  return rows;
}
