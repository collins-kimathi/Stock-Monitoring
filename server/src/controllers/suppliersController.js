import { query } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

function toApiSupplier(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    location: row.location,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}

export async function listSuppliers(req, res, next) {
  try {
    const { rows } = await query('select * from suppliers order by name asc');
    res.json(rows.map(toApiSupplier));
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(req, res, next) {
  try {
    const { name, category = null, contactPerson = null, phone = null, email = null, location = null } = req.body || {};
    if (!name || !String(name).trim()) throw new ApiError(400, 'name is required');

    const { rows } = await query(
      `insert into suppliers (name, category, contact_person, phone, email, location)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [name.trim(), category, contactPerson, phone, email, location]
    );

    res.status(201).json(toApiSupplier(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const fields = ['name', 'category', 'contact_person', 'phone', 'email', 'location', 'is_active'];
    const camelToSnake = {
      contactPerson: 'contact_person',
      isActive: 'is_active'
    };
    const body = req.body || {};

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
    const { rows } = await query(`update suppliers set ${updates.join(', ')} where id = $${values.length} returning *`, values);
    if (!rows[0]) throw new ApiError(404, `Supplier ${id} not found`);
    res.json(toApiSupplier(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      'update suppliers set is_active = false where id = $1 and is_active = true returning *',
      [id]
    );
    if (!rows[0]) throw new ApiError(404, `Supplier ${id} not found or already inactive`);
    res.json(toApiSupplier(rows[0]));
  } catch (error) {
    next(error);
  }
}