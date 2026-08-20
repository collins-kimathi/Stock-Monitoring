import { useState } from 'react';
import { Download, FileSpreadsheet, AlertCircle, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { Modal } from './Modal';

export function BulkImportModal({ onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // CSV parser helper
  const parseCsvText = (text) => {
    const lines = text.split(/\r\n|\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must contain a header row and at least one data row.');

    // Simple CSV parser supporting quotes
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (!values.length || values.every((v) => !v)) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      // Map to standard fields
      items.push({
        name: row.name || row.productname || row.itemname || '',
        sku: row.sku || row.code || row.itemcode || '',
        barcode: row.barcode || row.upc || row.ean || '',
        category: row.category || 'Stationery',
        brand: row.brand || row.publisher || '',
        location: row.location || row.shelf || row.bin || '',
        unit: row.unit || row.uom || 'pcs',
        quantity: Number(row.quantity || row.qty || row.onhand || 0),
        reorderLevel: Number(row.reorderlevel || row.minlevel || row.reorder || 10),
        maxLevel: Number(row.maxlevel || row.targetlevel || 0),
        buyingPrice: Number(row.buyingprice || row.costprice || row.cost || 0),
        wholesalePrice: Number(row.wholesaleprice || row.wholesale || 0),
        sellingPrice: Number(row.sellingprice || row.retailprice || row.price || 0),
        notes: row.notes || row.description || ''
      });
    }

    return items;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const items = parseCsvText(String(text));
        if (!items.length) throw new Error('No valid product rows found in CSV.');
        setParsedItems(items);
      } catch (err) {
        setError(err.message || 'Failed to parse CSV file.');
        setParsedItems([]);
      }
    };
    reader.readAsText(selected);
  };

  const downloadSampleTemplate = () => {
    const headers = [
      'Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Location', 'Unit',
      'Quantity', 'Cost Price (KES)', 'Wholesale Price (KES)', 'Selling Price (KES)',
      'Reorder Level', 'Max Level', 'Notes'
    ];
    const sampleRows = [
      ['A4 Ruled Exercise Book 200pg', 'BK-A4-200', '6161100223344', 'Books', 'Kartasi', 'Shelf A-1', 'pcs', 120, 95, 120, 140, 20, 200, 'Popular for secondary schools'],
      ['Bic Ballpoint Pen Blue', 'PEN-BIC-BLU', '6001048002011', 'Stationery', 'Bic', 'Shelf B-2', 'pcs', 350, 20, 25, 30, 50, 500, 'Box of 50'],
      ['HP A4 Printing Paper 80gsm', 'PAP-HP-80G', '884962871120', 'Printing', 'HP', 'Storage Bay 3', 'reams', 45, 520, 580, 650, 10, 100, '500 sheets per ream']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!parsedItems.length) return;
    setLoading(true);
    setError('');
    try {
      const res = await onImportSuccess(parsedItems);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Bulk Import Inventory via CSV"
      icon={FileSpreadsheet}
      onClose={onClose}
      footer={
        result ? (
          <button className="primary-button" onClick={onClose}>Done</button>
        ) : (
          <>
            <button className="secondary-button" onClick={onClose}>Cancel</button>
            <button
              className="primary-button"
              disabled={!parsedItems.length || loading}
              onClick={handleUpload}
            >
              {loading ? 'Processing...' : `Import ${parsedItems.length} Products`}
            </button>
          </>
        )
      }
    >
      <div className="bulk-import-body">
        {/* Template info */}
        <div className="import-helper">
          <p>
            Upload a spreadsheet (CSV) with your product catalog. Existing SKUs/Names will be updated, and new ones will be added.
          </p>
          <button className="secondary-button small" type="button" onClick={downloadSampleTemplate}>
            <Download size={14} /> Download Sample CSV Template
          </button>
        </div>

        {/* File Drop Area */}
        {!result && (
          <label className="csv-drop-zone">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <UploadCloud size={36} className="drop-icon" />
            <strong>{file ? file.name : 'Click to select or drop CSV file here'}</strong>
            <span>Supports .csv files with standard columns</span>
          </label>
        )}

        {/* Error Alert */}
        {error && (
          <div className="import-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="import-alert success">
            <CheckCircle2 size={24} />
            <div>
              <strong>Import Complete!</strong>
              <p>
                Created: {result.createdCount} new items | Updated: {result.updatedCount} existing items
              </p>
              {result.errors?.length ? (
                <ul className="import-error-list">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}

        {/* Preview of parsed rows */}
        {!result && parsedItems.length > 0 && (
          <div className="import-preview">
            <div className="preview-header">
              <span>Preview: {parsedItems.length} items ready</span>
            </div>
            <div className="table-wrap mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Price</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.slice(0, 6).map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.sku || '—'}</td>
                      <td>{item.category}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>KES {item.buyingPrice}</td>
                      <td>KES {item.sellingPrice}</td>
                      <td>{item.location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedItems.length > 6 && (
                <p className="preview-more">+ {parsedItems.length - 6} more rows...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
