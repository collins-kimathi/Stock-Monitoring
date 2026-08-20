import { Router } from 'express';
import {
  listProducts,
  getInventorySummary,
  createProduct,
  updateProduct,
  deleteProduct,
  listLowStockProducts,
  exportProducts,
  importProducts
} from '../controllers/productsController.js';

const router = Router();

router.get('/summary', getInventorySummary);
router.get('/export', exportProducts);
router.post('/import', importProducts);
router.get('/low-stock', listLowStockProducts);
router.get('/', listProducts);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;