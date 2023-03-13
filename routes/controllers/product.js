import LogService from '../../service/log-service.js';
import ProductService from '../../service/product-service.js';
import TokenService from '../../service/token-service.js';

class ProductController {
  constructor() {
    this.getProducts = this.getProducts.bind(this);
  }

  async getProducts(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      // Products
      const products = await ProductService.getProducts(req.body, next);

      // Add log
      LogService.products(`${user.login} - запрос списка товаров \n${JSON.stringify(req.body)}\n`);

      return res.json({data: products});
    } catch (e) {
      next(e);
    }
  }
}

export default new ProductController();
