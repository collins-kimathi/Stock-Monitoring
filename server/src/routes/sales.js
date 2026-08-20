import { Router } from 'express';
import {
  listSales,
  getSale,
  createSale,
  listProductSales
} from '../controllers/salesController.js';

const router = Router();

router.get('/', listSales);
router.get('/products', listProductSales);
router.post('/', createSale);
router.get('/:id', getSale);

export default router;