import { query } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

// Frontend (Services.jsx) expects camelCase `price` (already), plus a display
// `category` and `unit`. Postgres columns are snake_case in the schema but
// `services` uses camelCase-friendly names already, so this is minimal.
function toApiService(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    price: Number(row.price),
    createdAt: row.created_at
  };
}

export async function listServices(req, res, next) {
  try {
    const { rows } = await query('select * from services order by created_at asc');
    res.json(rows.map(toApiService));
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, category = 'Cyber', unit = 'each', price = 0 } = req.body || {};
    if (!name || !String(name).trim()) throw new ApiError(400, 'name is required');

    const { rows } = await query(
      'insert into services (name, category, unit, price) values ($1, $2, $3, $4) returning *',
      [name.trim(), category, unit, Number(price) || 0]
    );

    res.status(201).json(toApiService(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const fields = ['name', 'category', 'unit', 'price'];
    const camelToSnake = {};

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
    const { rows } = await query(`update services set ${updates.join(', ')} where id = $${values.length} returning *`, values);

    if (!rows[0]) throw new ApiError(404, `Service ${id} not found`);
    res.json(toApiService(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await query('delete from services where id = $1', [id]);
    if (!rowCount) throw new ApiError(404, `Service ${id} not found`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}