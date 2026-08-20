import { query, withTransaction } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

const CATEGORIES = ['Books', 'Stationery', 'Printing', 'Cyber', 'Office', 'Electronics', 'Packaging', 'Uniforms', 'Other'];

function toApiProduct(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku || '',
    barcode: row.barcode || '',
    category: row.category || 'Stationery',
    brand: row.brand || '',
    location: row.location || '',
    unit: row.unit || 'pcs',
    quantity: Number(row.quantity || 0),
    reorderLevel: Number(row.reorder_level || 0),
    maxLevel: Number(row.max_level || 0),
    buyingPrice: Number(row.buying_price || 0),
    wholesalePrice: Number(row.wholesale_price || 0),
    sellingPrice: Number(row.selling_price || 0),
    supplierId: row.supplier_id || null,
    supplierName: row.supplier_name || null,
    notes: row.notes || '',
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const BASE_SELECT = `
  p.id, p.name, p.sku, p.barcode, p.category, p.brand, p.location, p.unit,
  p.quantity, p.reorder_level, p.max_level, p.buying_price, p.wholesale_price,
  p.selling_price, p.supplier_id, p.is_active, p.notes, p.created_at, p.updated_at,
  s.name as supplier_name
  from products p
  left join suppliers s on s.id = p.supplier_id
`;

/**
 * GET /api/products
 * Query Params: page, limit, search, category, stockStatus, supplierId, location, sortBy, sortDir, includeInactive
 */
export async function listProducts(req, res, next) {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      category = 'All',
      stockStatus = 'all',
      supplierId = '',
      location = '',
      sortBy = 'created_at',
      sortDir = 'desc',
      includeInactive = 'false',
      rawArray = 'false'
    } = req.query;

    const conditions = [];
    const params = [];

    // Active condition
    if (includeInactive !== 'true') {
      conditions.push('p.is_active = true');
    }

    // Search query across multiple fields
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(`(
        lower(p.name) like $${idx} or
        lower(coalesce(p.sku, '')) like $${idx} or
        lower(coalesce(p.barcode, '')) like $${idx} or
        lower(coalesce(p.brand, '')) like $${idx} or
        lower(coalesce(p.location, '')) like $${idx} or
        lower(coalesce(p.category, '')) like $${idx}
      )`);
    }

    // Category filter
    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }

    // Supplier filter
    if (supplierId && supplierId.trim()) {
      params.push(supplierId);
      conditions.push(`p.supplier_id = $${params.length}`);
    }

    // Location filter
    if (location && location.trim()) {
      params.push(location);
      conditions.push(`p.location = $${params.length}`);
    }

    // Stock status filter
    if (stockStatus === 'in') {
      conditions.push('p.quantity > p.reorder_level');
    } else if (stockStatus === 'low') {
      conditions.push('p.quantity <= p.reorder_level and p.quantity > 0');
    } else if (stockStatus === 'out') {
      conditions.push('p.quantity <= 0');
    }

    const whereSql = conditions.length ? `where ${conditions.join(' and ')}` : '';

    // Valid sort fields to prevent SQL injection
    const allowedSorts = {
      name: 'p.name',
      sku: 'p.sku',
      quantity: 'p.quantity',
      buyingPrice: 'p.buying_price',
      sellingPrice: 'p.selling_price',
      category: 'p.category',
      location: 'p.location',
      created_at: 'p.created_at',
      updated_at: 'p.updated_at'
    };

    const sortColumn = allowedSorts[sortBy] || 'p.created_at';
    const direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // If client requested unpaginated flat array (e.g. for simple dropdowns or legacy clients)
    if (limit === 'all' || rawArray === 'true') {
      const { rows } = await query(
        `select ${BASE_SELECT} ${whereSql} order by ${sortColumn} ${direction}`,
        params
      );
      return res.json(rows.map(toApiProduct));
    }

    // Total count for pagination
    const countRes = await query(
      `select count(*) as total,
              coalesce(sum(p.quantity), 0) as total_units,
              coalesce(sum(p.quantity * p.buying_price), 0) as total_valuation,
              coalesce(sum(p.quantity * p.selling_price), 0) as total_retail_valuation
       from products p ${whereSql}`,
      params
    );

    const total = Number(countRes.rows[0].total || 0);
    const totalUnits = Number(countRes.rows[0].total_units || 0);
    const totalValuation = Number(countRes.rows[0].total_valuation || 0);
    const totalRetailValuation = Number(countRes.rows[0].total_retail_valuation || 0);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    params.push(limitNum);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const { rows } = await query(
      `select ${BASE_SELECT} ${whereSql} order by ${sortColumn} ${direction} limit $${limitIdx} offset $${offsetIdx}`,
      params
    );

    res.json({
      data: rows.map(toApiProduct),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
      summary: {
        totalItems: total,
        totalUnits,
        totalValuation,
        totalRetailValuation,
        potentialProfit: totalRetailValuation - totalValuation
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/summary
 * Overview KPI metrics for dashboard & analytics
 */
export async function getInventorySummary(req, res, next) {
  try {
    const summaryQuery = `
      select
        count(*) as total_skus,
        coalesce(sum(quantity), 0) as total_units,
        coalesce(sum(quantity * buying_price), 0) as total_cost_value,
        coalesce(sum(quantity * selling_price), 0) as total_retail_value,
        count(*) filter (where quantity <= reorder_level and quantity > 0) as low_stock_count,
        count(*) filter (where quantity <= 0) as out_of_stock_count,
        count(*) filter (where quantity > reorder_level) as healthy_stock_count
      from products
      where is_active = true
    `;

    const categoriesQuery = `
      select category, count(*) as count, coalesce(sum(quantity), 0) as units, coalesce(sum(quantity * buying_price), 0) as value
      from products
      where is_active = true
      group by category
      order by value desc
    `;

    const [summaryRes, catRes] = await Promise.all([
      query(summaryQuery),
      query(categoriesQuery)
    ]);

    const s = summaryRes.rows[0];
    res.json({
      totalSkus: Number(s.total_skus || 0),
      totalUnits: Number(s.total_units || 0),
      totalCostValue: Number(s.total_cost_value || 0),
      totalRetailValue: Number(s.total_retail_value || 0),
      potentialProfit: Number(s.total_retail_value || 0) - Number(s.total_cost_value || 0),
      lowStockCount: Number(s.low_stock_count || 0),
      outOfStockCount: Number(s.out_of_stock_count || 0),
      healthyStockCount: Number(s.healthy_stock_count || 0),
      categories: catRes.rows.map(r => ({
        category: r.category,
        count: Number(r.count),
        units: Number(r.units),
        value: Number(r.value)
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const {
      name,
      sku = null,
      barcode = null,
      category = 'Stationery',
      brand = null,
      location = null,
      unit = 'pcs',
      quantity = 0,
      reorderLevel = 0,
      maxLevel = 0,
      buyingPrice = 0,
      wholesalePrice = 0,
      sellingPrice = 0,
      supplierId = null,
      notes = null
    } = req.body || {};

    if (!name || !String(name).trim()) throw new ApiError(400, 'Product name is required');

    const { rows } = await query(
      `insert into products (
        name, sku, barcode, category, brand, location, unit, quantity,
        reorder_level, max_level, buying_price, wholesale_price, selling_price,
        supplier_id, notes
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      returning *`,
      [
        name.trim(),
        sku ? String(sku).trim() : null,
        barcode ? String(barcode).trim() : null,
        category || 'Stationery',
        brand ? String(brand).trim() : null,
        location ? String(location).trim() : null,
        unit || 'pcs',
        Math.max(0, Number(quantity) || 0),
        Math.max(0, Number(reorderLevel) || 0),
        Math.max(0, Number(maxLevel) || 0),
        Math.max(0, Number(buyingPrice) || 0),
        Math.max(0, Number(wholesalePrice) || 0),
        Math.max(0, Number(sellingPrice) || 0),
        supplierId || null,
        notes ? String(notes).trim() : null
      ]
    );

    // If initial quantity > 0, log initial stock movement
    if (Number(quantity) > 0) {
      await query(
        `insert into stock_movements (product_id, type, quantity, reason, reference_type)
         values ($1, 'stock_in', $2, 'Initial Stock Creation', 'initial')`,
        [rows[0].id, Number(quantity)]
      ).catch(() => {});
    }

    res.status(201).json(toApiProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const camelToSnake = {
      reorderLevel: 'reorder_level',
      maxLevel: 'max_level',
      buyingPrice: 'buying_price',
      wholesalePrice: 'wholesale_price',
      sellingPrice: 'selling_price',
      supplierId: 'supplier_id',
      isActive: 'is_active'
    };

    const allowed = [
      'name', 'sku', 'barcode', 'category', 'brand', 'location', 'unit',
      'quantity', 'reorder_level', 'max_level', 'buying_price', 'wholesale_price',
      'selling_price', 'supplier_id', 'is_active', 'notes'
    ];

    const body = req.body || {};
    const updates = [];
    const values = [];

    Object.entries(body).forEach(([key, value]) => {
      const col = camelToSnake[key] || key;
      if (allowed.includes(col)) {
        values.push(value);
        updates.push(`${col} = $${values.length}`);
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
    const { rows } = await query(
      'update products set is_active = false where id = $1 and is_active = true returning *',
      [id]
    );
    if (!rows[0]) throw new ApiError(404, `Product ${id} not found or already inactive`);
    res.json(toApiProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function listLowStockProducts(req, res, next) {
  try {
    const { rows } = await query(
      `select ${BASE_SELECT} where p.is_active = true and p.quantity <= p.reorder_level order by p.quantity asc`
    );
    res.json(rows.map(toApiProduct));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/export
 * Downloads full or filtered inventory as CSV
 */
export async function exportProducts(req, res, next) {
  try {
    const { rows } = await query(`
      select p.*, s.name as supplier_name
      from products p
      left join suppliers s on s.id = p.supplier_id
      where p.is_active = true
      order by p.name asc
    `);

    const headers = [
      'Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Location', 'Unit',
      'Quantity', 'Cost Price (KES)', 'Wholesale Price (KES)', 'Selling Price (KES)',
      'Reorder Level', 'Max Level', 'Supplier', 'Notes'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];

    rows.forEach((p) => {
      csvRows.push([
        escapeCsv(p.name),
        escapeCsv(p.sku),
        escapeCsv(p.barcode),
        escapeCsv(p.category),
        escapeCsv(p.brand),
        escapeCsv(p.location),
        escapeCsv(p.unit),
        p.quantity || 0,
        p.buying_price || 0,
        p.wholesale_price || 0,
        p.selling_price || 0,
        p.reorder_level || 0,
        p.max_level || 0,
        escapeCsv(p.supplier_name),
        escapeCsv(p.notes)
      ].join(','));
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inventory_export_${dateStr}.csv"`);
    res.send(csvRows.join('\r\n'));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products/import
 * Bulk imports products from array of objects (parsed CSV)
 */
export async function importProducts(req, res, next) {
  try {
    const { items = [] } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      throw new ApiError(400, 'items array is required');
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    await withTransaction(async (client) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const name = String(item.name || '').trim();
        if (!name) {
          errors.push(`Row ${i + 1}: Name is required`);
          continue;
        }

        const sku = item.sku ? String(item.sku).trim() : null;
        const barcode = item.barcode ? String(item.barcode).trim() : null;
        const category = item.category || 'Stationery';
        const brand = item.brand || null;
        const location = item.location || null;
        const unit = item.unit || 'pcs';
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const reorderLevel = Math.max(0, Number(item.reorderLevel) || 0);
        const maxLevel = Math.max(0, Number(item.maxLevel) || 0);
        const buyingPrice = Math.max(0, Number(item.buyingPrice) || 0);
        const wholesalePrice = Math.max(0, Number(item.wholesalePrice) || 0);
        const sellingPrice = Math.max(0, Number(item.sellingPrice) || 0);
        const notes = item.notes || null;

        // Upsert by SKU if provided, else by Name
        let existingId = null;
        if (sku) {
          const match = await client.query('select id from products where sku = $1 and is_active = true', [sku]);
          if (match.rows[0]) existingId = match.rows[0].id;
        }
        if (!existingId) {
          const match = await client.query('select id from products where lower(name) = lower($1) and is_active = true', [name]);
          if (match.rows[0]) existingId = match.rows[0].id;
        }

        if (existingId) {
          await client.query(
            `update products set
              name = $1, barcode = coalesce($2, barcode), category = $3, brand = coalesce($4, brand),
              location = coalesce($5, location), unit = $6, buying_price = $7, wholesale_price = $8,
              selling_price = $9, reorder_level = $10, max_level = $11, notes = coalesce($12, notes)
             where id = $13`,
            [name, barcode, category, brand, location, unit, buyingPrice, wholesalePrice, sellingPrice, reorderLevel, maxLevel, notes, existingId]
          );
          updatedCount++;
        } else {
          await client.query(
            `insert into products (
              name, sku, barcode, category, brand, location, unit, quantity,
              reorder_level, max_level, buying_price, wholesale_price, selling_price, notes
            ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [name, sku, barcode, category, brand, location, unit, quantity, reorderLevel, maxLevel, buyingPrice, wholesalePrice, sellingPrice, notes]
          );
          createdCount++;
        }
      }
    });

    res.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: items.length,
      errors
    });
  } catch (error) {
    next(error);
  }
}

export { CATEGORIES };
