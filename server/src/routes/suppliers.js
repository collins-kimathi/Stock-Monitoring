import { Router } from 'express';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/suppliersController.js';

const router = Router();

router.get('/', listSuppliers);
router.post('/', createSupplier);
router.patch('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;