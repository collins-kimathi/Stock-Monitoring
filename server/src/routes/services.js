import { Router } from 'express';
import {
  listServices,
  createService,
  updateService,
  deleteService
} from '../controllers/servicesController.js';

const router = Router();

router.get('/', listServices);
router.post('/', createService);
router.patch('/:id', updateService);
router.delete('/:id', deleteService);

export default router;