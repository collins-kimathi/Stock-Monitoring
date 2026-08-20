import { Router } from 'express';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listLowStockProducts
} from '../controllers/productsController.js';

const router = Router();

router.get('/', listProducts);
router.post('/', createProduct);
router.get('/low-stock', listLowStockProducts);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;