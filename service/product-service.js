import pool from '../db/db.js';
import ApiError from '../exceptions/api-error.js';

class ProductService {
  constructor() {
    this.getProducts = this.getProducts.bind(this);
  }

  requestСonditions(filter) {
    // Данный метод формирует условия поиска для SQL запроса
    const warehouse = filter.warehouse.map((item) => item.id).join();
    const category = filter.category.map((item) => item.id).join();
    const search = filter.search;

    // true - если все фильтры пустые
    const searchIsNull = [warehouse, category, search].every(
      (item) => item === null || item === ''
    );

    if (searchIsNull) throw ApiError.BadRequest('Не заданы параметры поиска');

    let warehouseQuery = warehouse.length
      ? `mz_p.id_warehouse IN (${warehouse})`
      : '';
    let categoryQuery = category.length
      ? `mz_p.id_category IN (${category})`
      : '';
    let searchQuery = search
      ? `(mz_n.name LIKE '%${search}%' OR mz_p.sn LIKE '%${search}%')`
      : '';

    let result = 'WHERE ';
    result += warehouseQuery ? warehouseQuery : '';
    result += warehouseQuery ? ` AND ${categoryQuery}` : categoryQuery;
    //result += warehouseQuery && categoryQuery ? ` AND ${searchQuery}` : searchQuery;

    console.log('requestСonditions', result);

    return result;
  }

  async getProducts(filter, next) {
    let searchQuery = this.requestСonditions(filter);

    const getProductsQuery = `
        SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.id_warehouse, mz_w.warehouse_title, mz_p.id_category, mz_c.category_title, mz_p.sn, mz_p.count, mz_n.accounting_sn
        FROM mz_products mz_p
        JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
        JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
        JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
        ${searchQuery}`;

    let products = pool
      .execute(getProductsQuery)
      .then((result) => {
        if (result[0].length === 0)
          throw ApiError.NotFound('По заданным критериям ничего не найдено');
        return result[0];
      })
      .catch(function (err) {
        next(err);
      });

    return products;
  }
}

export default new ProductService();
