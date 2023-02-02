import { Router } from 'express';
import { test } from './controllers/test.js';
import { getWarehouse } from './controllers/getWarehouse.js';
import { getCategory } from './controllers/getCategory.js';
import { addProduct } from './controllers/addProduct.js';
import { getProduct } from './controllers/getProducts.js';
import { getProductById } from './controllers/getProductById.js';
import { getProductHistoryById } from './controllers/getHistory.js';
import { getProperty } from './controllers/getProperty.js';
import { getUnit } from './controllers/getUnit.js';
import { getProductByCategory } from './controllers/receiptProduct/getProductByCategory.js';
import { receiptProduct } from './controllers/receiptProduct/receiptProduct.js';
import { transferProduct } from './controllers/transferProduct.js';
import { getSnList } from './controllers/getSnList.js';
import { getNomenclature } from './controllers/getNomenclature.js';
import { getComments } from './controllers/getComments.js';
import { addComment } from './controllers/addComment.js';

import UserController from './controllers/user.js'
import cors from 'cors';
import authMiddleware from '../middleware/auth-middleware.js';











const router = Router();

router.get('/', (req, res) => {
  res.send('I am working');
});

router.get('/test', cors(), test);
router.post('/get_product/:id', cors(), getProductById);
router.get('/get_product_history/:id', cors(), getProductHistoryById);
router.post('/get_warehouse', cors(), getWarehouse);
router.post('/get_category', cors(), getCategory);
router.post('/get_unit', cors(), getUnit);
router.post('/get_products', authMiddleware, getProduct);
router.post('/addProduct', authMiddleware, addProduct);
router.post('/get_sn_list', authMiddleware, getSnList);
router.get('/get_nomenclature', authMiddleware, getNomenclature);
// Users
router.post('/register', cors(), UserController.registration);
router.post('/auth', cors(), UserController.authorization);
router.post('/getUsers', cors(), UserController.getUsers);
router.post('/test1', authMiddleware, UserController.test1);

// Propperty
router.get('/get_property/:category_id', cors(), getProperty);

// Receipt
router.post('/receipt_product', cors(), receiptProduct);
router.post('/get_receipt_products/:category_id', cors(), getProductByCategory);

// Transfer
router.post('/transfer_product', cors(), transferProduct);

// Comments
router.get('/get_comments/:id', cors(), getComments);
router.post('/add_comment', cors(), addComment);

export default router;
