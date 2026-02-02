import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import salesRoutes from './sales.routes.js';
import paymentRoutes from './payment.routes.js';
import stockRoutes from './stock.routes.js';
import reportRoutes from './report.routes.js';
import purchaseRoutes from './purchase.routes.js';
import draftRoutes from './draft.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/sales', salesRoutes);
router.use('/payments', paymentRoutes);
router.use('/stock', stockRoutes);
router.use('/reports', reportRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/purchases/drafts', draftRoutes);

export default router;

