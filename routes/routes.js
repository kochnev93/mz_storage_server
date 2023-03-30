import { Router } from 'express';
import { test } from './controllers/test.js';
import { getWarehouse } from './controllers/getWarehouse.js';
import { getWarehouseList } from './controllers/getWarehouseList.js';
import { getCategory } from './controllers/getCategory.js';
import { addProduct } from './controllers/addProduct.js';
import { getProduct } from './controllers/getProducts.js';
import { getProductById } from './controllers/getProductById.js';
import { getProductHistoryById } from './controllers/getHistory.js';
import { getProperty } from './controllers/getProperty.js';
import { getUnit } from './controllers/getUnit.js';
import { getProductByCategory } from './controllers/receiptProduct/getProductByCategory.js';
import { receiptProduct } from './controllers/receiptProduct/receiptProduct.js';
import { rateProduct } from './controllers/rateProduct.js';
import { transferProduct } from './controllers/transferProduct.js';
import { getSnList } from './controllers/getSnList.js';
import { getNomenclature } from './controllers/getNomenclature.js';
import { getComments } from './controllers/getComments.js';
import { addComment } from './controllers/addComment.js';
import { getReceiptList } from './controllers/getReceiptList.js';
import { getContragents } from './controllers/getContragents.js';
import { getReceiptInfo } from './controllers/receiptProduct/getReceiptInfo.js';
import { getProductByWarehouseID } from './controllers/getProductsByWarehouseID.js';
import { transferSomeProduct } from './controllers/transferSomeProduct.js';
import { upload } from './controllers/upload.js';
import { getRoles } from './controllers/getRoles.js';
import { getTransfers } from './controllers/getTransfers.js';
import { fileMidlleware } from '../middleware/upload-middleware.js';

import UserController from './controllers/user.js'
import ProductController from './controllers/product.js'

import cors from 'cors';
import authMiddleware from '../middleware/auth-middleware.js';
import cookieParser from 'cookie-parser';










const router = Router();

router.get('/', (req, res) => {
  res.send('I am working');
});

router.get('/test', cors(), test);
router.post('/get_product/:id', cors(), getProductById);
router.post('/get_history', cors(), getProductHistoryById);
router.post('/get_warehouse', cors(), getWarehouse);
router.get('/get_warehouse', cors(), getWarehouse);
router.get('/get_warehouse/all', cors(), getWarehouseList);
router.post('/get_category', cors(), getCategory);
router.get('/get_category', cors(), getCategory);
router.post('/get_unit', cors(), getUnit);
//router.post('/get_products', authMiddleware, getProduct);
router.post('/get_products', authMiddleware, ProductController.getProducts);

router.get('/warehouse/:id/get_products', cors(), getProductByWarehouseID);
router.post('/addProduct', authMiddleware, addProduct);
router.post('/get_sn_list', authMiddleware, getSnList);
router.get('/get_nomenclature', authMiddleware, getNomenclature);
router.post('/get_contragents', cors(), getContragents);
// Users
router.post('/register', cors(), UserController.registration);
router.post('/auth', cors(), UserController.authorization);
router.get('/getUsers', cors(), UserController.getUsers);
router.post('/test1', authMiddleware, UserController.test1);
router.get('/get_roles', cors(), getRoles);
router.post('/update_user', cors(), UserController.updateUser);
router.get('/block_user/:id', cors(), UserController.blockUser);
router.get('/unlock_user/:id', cors(), UserController.unlockUser);
router.post('/refresh', cors(), UserController.refreshToken);

// Propperty
router.get('/get_property/:category_id', cors(), getProperty);

// Receipt
router.post('/receipt_product', cors(), receiptProduct);
router.post('/get_receipt_products/:category_id', cors(), getProductByCategory);
router.get('/get_receiptList', cors(), getReceiptList);
router.get('/get_receipt_info/:id_receipt', cors(), getReceiptInfo );

//Rate
router.post('/rate_product', cors(), rateProduct);

// Transfer
//router.post('/transfer_product', cors(), transferProduct);
router.post('/transfer_product', cors(), ProductController.transferProduct);
//router.post('/transfer_products', cors(), transferSomeProduct);
router.post('/transfer_products', cors(), ProductController.transferSomeProducts);

router.post('/get_transfers', cors(), getTransfers);


// Comments
router.get('/get_comments/:id', cors(), getComments);
router.post('/add_comment', cors(), addComment);

// Files
router.post('/upload', fileMidlleware.single('avatar'), upload);

export default router; 
 