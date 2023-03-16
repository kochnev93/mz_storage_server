import ApiError from '../../exceptions/api-error.js';
import LogService from '../../service/log-service.js';
import ProductService from '../../service/product-service.js';
import TokenService from '../../service/token-service.js';

class ProductController {
  constructor() {
    this.getProducts = this.getProducts.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.transferProduct = this.transferProduct.bind(this);
    this.transferSomeProducts = this.transferSomeProducts.bind(this);
  }

  async getProducts(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      // Products
      const products = await ProductService.getProducts(req.body, next);

      // Add log
      LogService.products(
        `${user.login} --> запрос списка товаров ${JSON.stringify(
          products.search
        )}\n`
      );

      return res.json({ data: products.items });
    } catch (e) {
      next(e);
    }
  }

  async updateProduct(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      if (user.role !== 'admin')
        throw ApiError.Forbidden('Недостаточно прав доступа');

      // Products
      const products = await ProductService.updateProduct(req.body, next);

      // Add log
      LogService.products(
        `${user.login} --> обновил товар ${JSON.stringify(products.search)}\n`
      );

      return res.json({ data: products.items });
    } catch (e) {
      next(e);
    }
  }

  async transferProduct(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      if (user.role === 'viewer')
        throw ApiError.Forbidden('Недостаточно прав доступа');

      let transferProduct;

      if (req.body.accounting_sn) {
        transferProduct = await ProductService.transferProductWithSN(
          req.body,
          user.id,
          next
        );
      } else {
        transferProduct = await ProductService.transferProductWithCount(
          req.body,
          user.id,
          next
        );
      }

      if (transferProduct) {
        LogService.products(`${user.login} --> переместил товар (id: ${req.body.id_product}) со склада (id: ${req.body.old_warehouse}) на склад (id: ${req.body.new_warehouse}). SN: ${req.body.sn}, count: ${req.body.transfer_count}\n`);
        return res.json({ data: 'Перемещение выполнено' });
      }

      throw ApiError.BadRequest(
        `Неизвестная ошибка, обратитесь к администратору`
      );

    } catch (e) {
      next(e);
    }
  }


  async transferSomeProducts(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      if (user.role === 'viewer') throw ApiError.Forbidden('Недостаточно прав доступа');

      let transferProducts = await ProductService.transferSomeProducts(
        req.body,
        user.id,
        next
      );
      

      if (transferProducts) {
        LogService.products(`${user.login} --> переместил товары со склада (id: ${req.body.old_warehouse}) на склад (id: ${req.body.new_warehouse}). ${JSON.stringify(req.body.products)}\n`);
        return res.json({ data: 'Перемещение выполнено', transfers: transferProducts});
      }

      throw ApiError.BadRequest(
        `Неизвестная ошибка, обратитесь к администратору`
      );

    } catch (e) {
      next(e);
    }
  }
}

export default new ProductController();
