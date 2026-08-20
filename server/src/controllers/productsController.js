import { query } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

const CATEGORIES = ['Books', 'Stationery', 'Printing', 'Cyber', 'Office'];

// The frontend (Inventory.jsx, Sales.jsx, App.jsx) expects camelCase fields
// like reorderLevel/buyingPrice/sellingPrice, while Postgres columns are
// snake_case. Map here so no frontend components need to change.
function toApiProduct(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    unit: row.unit,
    quantity: Number(row.quantity),
    reorderLevel: Number(row.reorder_level),
    buyingPrice: Number(row.buying_price),
    sellingPrice: Number(row.selling_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listProducts(req, res, next) {
  try {
    const { rows } = await query('select * from products order by created_at desc');
    res.json(rows.map(toApiProduct));
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const {
      name,
      sku = null,
      category = 'Stationery',
      unit = 'pcs',
      quantity = 0,
      reorderLevel = 0,
      buyingPrice = 0,
      sellingPrice = 0
    } = req.body || {};

    if (!name || !String(name).trim()) throw new ApiError(400, 'name is required');

    const { rows } = await query(
      `insert into products (name, sku, category, unit, quantity, reorder_level, buying_price, selling_price)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [name.trim(), sku, category, unit, Number(quantity) || 0, Number(reorderLevel) || 0, Number(buyingPrice) || 0, Number(sellingPrice) || 0]
    );

    res.status(201).json(toApiProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const fields = ['name', 'sku', 'category', 'unit', 'quantity', 'reorder_level', 'buying_price', 'selling_price'];
    const body = req.body || {};
    const camelToSnake = {
      reorderLevel: 'reorder_level',
      buyingPrice: 'buying_price',
      sellingPrice: 'selling_price'
    };

    const updates = [];
    const values = [];
    Object.entries(body).forEach(([key, value]) => {
      const column = camelToSnake[key] || key;
      if (fields.includes(column)) {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
      }
    });

    if (!updates.length) throw new ApiError(400, 'No valid fields to update');

    values.push(id);
    const { rows } = await query(
      `update products set ${updates.join(', ')} where id = $${values.length} returning *`,
      values
    );

    if (!rows[0]) throw new ApiError(404, `Product ${id} not found`);
    res.json(toApiProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await query('delete from products where id = $1', [id]);
    if (!rowCount) throw new ApiError(404, `Product ${id} not found`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listLowStockProducts(req, res, next) {
  try {
    const { rows } = await query('select * from products where quantity <= reorder_level order by quantity asc');
    res.json(rows.map(toApiProduct));
  } catch (error) {
    next(error);
  }
}

export { CATEGORIES };
