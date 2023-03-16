import pool from '../db/db.js';
import ApiError from '../exceptions/api-error.js';

class ProductService {
  constructor() {
    this.getProducts = this.getProducts.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.transferProductWithSN = this.transferProductWithSN.bind(this);
    this.transferProductWithCount = this.transferProductWithCount.bind(this);
    this.transferSomeProducts = this.transferSomeProducts.bind(this);
  }

  async _checkAvailabilityProduct(product, next) {
    //Проверка наличия товара на складе
    let checkQuery;

    console.log('_checkAvailabilityProduct', product);

    if (product.accounting_sn) {
      checkQuery = `SELECT * FROM mz_products WHERE sn='${product.sn}' AND id_warehouse='${product.old_warehouse}' `;
    } else {
      checkQuery = `SELECT * FROM mz_products WHERE count='${product.count}' AND id_warehouse='${product.old_warehouse}' `;
    }

    let checkProduct = await pool
      .execute(checkQuery)
      .then((result) => {
        console.log('_checkAvailabilityProduct-QUERY', result[0]);
        return result[0].length === 1 ? true : false;
      })
      .catch(function (err) {
        if(next) next(err);
        throw Error(err)
      });

    console.log('_checkAvailabilityProduct-RETURN', checkProduct.length === 1);

    return checkProduct;
  }

  async _checkAvailabilitySomeProducts(products, warehouseFrom, next) {
    // Проверка наличия товаров на складе, при перемещениии нескольких товаров

    console.log('_checkAvailabilitySomeProducts', products, next);

    for (let i = 0; i < products.length; i++) {
      const query = `SELECT * FROM mz_products WHERE id_product='${
        products[i].id
      }' AND id_warehouse='${warehouseFrom[0].id}' AND ${
        products[i].accounting_sn
          ? `sn='${products[i].sn}'`
          : `count = '${products[i].count}'`
      }`;

      let check = await pool
        .execute(query)
        .then((result) => {
          return result[0].length === 1 ? true : false;
        })
        .catch(function (err) {
          next(err);
          return false;
        });

      if (!check) return false;
    }

    return true;
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

    // Формирование поиска для SQL
    let result = 'WHERE ';
    result += warehouseQuery ? warehouseQuery : '';

    if (warehouseQuery) {
      result += categoryQuery ? ` AND ${categoryQuery}` : '';
    } else {
      result += categoryQuery;
    }

    if (warehouseQuery || categoryQuery) {
      result += searchQuery ? ` AND ${searchQuery}` : '';
    } else {
      result += searchQuery;
    }

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

    let products = await pool
      .execute(getProductsQuery)
      .then((result) => {
        if (result[0].length === 0)
          throw ApiError.NotFound('По заданным критериям ничего не найдено');
        return result[0];
      })
      .catch(function (err) {
        next(err);
      });

    return { items: products, search: searchQuery };
  }

  async updateProduct(product, next) {
    let searchQuery = this.requestСonditions(filter);

    const updateProductQuery = `
        SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.id_warehouse, mz_w.warehouse_title, mz_p.id_category, mz_c.category_title, mz_p.sn, mz_p.count, mz_n.accounting_sn
        FROM mz_products mz_p
        JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
        JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
        JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
        ${searchQuery}`;

    let products = await pool
      .execute(getProductsQuery)
      .then((result) => {
        if (result[0].length === 0)
          throw ApiError.NotFound('По заданным критериям ничего не найдено');
        return result[0];
      })
      .catch(function (err) {
        next(err);
      });

    return { items: products, search: searchQuery };
  }

  async transferProductWithSN(transfer, id_author, next) {
    // Перемещение товара с серийным номером

    console.log('transferProductWithSN', transfer);

    const {
      accounting_sn,
      new_warehouse,
      old_warehouse,
      id_product,
      sn,
      transfer_count,
      count,
    } = transfer;

    // Проверяем наличие товара на складе
    let checkProduct = await this._checkAvailabilityProduct(transfer, next);
    if (!checkProduct)
      throw ApiError.BadRequest(
        `Продукт не найден на данном складе. Обновите страницу`
      );

    const updateWarehouse = `UPDATE mz_products SET id_warehouse='${new_warehouse}', id_author='${id_author}' WHERE sn='${sn}'`;
    const addTransfer = `INSERT INTO mz_transfers (id_product, old_id_warehouse, new_id_warehouse, id_author, date) VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${id_author}', ( SELECT NOW() )) `;

    let transferProduct = await pool
      .execute(updateWarehouse)
      .then((result) => {
        console.log(result);
        return pool.execute(addTransfer);
      })
      .then((result) => {
        return true;
      })
      .catch(function (err) {
        next(err);
      });

    return transferProduct ? true : false;
  }

  async transferProductWithCount(transfer, id_author, next) {
    // Перемещение товара без серийного номера

    const {
      accounting_sn,
      new_warehouse,
      old_warehouse,
      id_product,
      sn,
      transfer_count,
      count,
    } = transfer;

    // Проверяем наличие товара на складе
    let checkProduct = await this._checkAvailabilityProduct(transfer, next);
    if (!checkProduct)
      throw ApiError.BadRequest(
        `Продукт не найден на данном складе, либо количество не совпадает с БД. Обновите страницу`
      );

    // Проверяем наличие товара на новом складе
    const countFromNewWarehouse = await pool
      .execute(
        `SELECT * FROM mz_products WHERE id_warehouse='${new_warehouse}' AND id_product='${id_product}'`
      )
      .then((result) => {
        return result[0].length === 1 ? true : false;
      })
      .catch(function (err) {
        next(err);
      });

    if (countFromNewWarehouse) {
      // Товар имеется на новом складе

      const updateCount = `UPDATE mz_products SET count=count+'${transfer_count}' WHERE id_product='${id_product}' AND id_warehouse='${new_warehouse}'`;
      const subtractionCount = `UPDATE mz_products SET count=count-'${transfer_count}' WHERE id_product='${id_product}' AND id_warehouse='${old_warehouse}'`;
      const transferLog = `
      INSERT INTO mz_transfers 
      (id_product, old_id_warehouse, new_id_warehouse, count, id_author, date)
      VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${transfer_count}', '${id_author}', ( SELECT NOW() ) )`;

      let transfer = await pool
        .execute(updateCount)
        .then((result) => {
          return pool.execute(subtractionCount);
        })
        .then((result) => {
          return pool.execute(transferLog);
        })
        .then((result) => {
          return true;
        })
        .catch(function (err) {
          next(err);
        });

      return transfer ? true : false;
    }

    if (!countFromNewWarehouse) {
      // Товар не имеется на новом складе

      // Получаем значения продукта из БД
      const optionsProduct = await pool
        .execute(
          `SELECT id_nomenclature, id_category FROM mz_products WHERE id_warehouse='${old_warehouse}' AND id_product='${id_product}'`
        )
        .then((result) => {
          return result[0][0];
        })
        .catch(function (err) {
          next(err);
        });

      const { id_nomenclature, id_category } = optionsProduct;

      const transferProduct = `
      INSERT INTO mz_products 
      (id_product, id_nomenclature, id_category, id_warehouse, count, date_create, id_author)
      VALUES ('${id_product}', '${id_nomenclature}', '${id_category}', '${new_warehouse}', '${transfer_count}', ( SELECT NOW() ), '${id_author}' )`;

      const subtractionCount = `UPDATE mz_products SET count=count-'${transfer_count}' WHERE id_product='${id_product}' AND id_warehouse='${old_warehouse}'`;

      const transferLog = `
      INSERT INTO mz_transfers 
      (id_product, old_id_warehouse, new_id_warehouse, count, id_author, date)
      VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${transfer_count}', '${id_author}', ( SELECT NOW() ) )`;

      const transfer = await pool
        .execute(transferProduct)
        .then((result) => {
          return pool.execute(subtractionCount);
        })
        .then((result) => {
          return pool.execute(transferLog);
        })
        .then((result) => {
          return true;
        })
        .catch(function (err) {
          next(err);
        });

      return transfer ? true : false;
    }

    return false;
  }

  async transferSomeProducts(transfers, id_author, next) {
    const { warehouseFrom, warehouseTo, products } = transfers;

    // Проверка наличия товаров на складе
    let check = await this._checkAvailabilitySomeProducts(
      products,
      warehouseFrom,
      next
    );

    console.log('_checkAvailabilitySomeProducts-RETURN', check);

    if (!check)
      throw ApiError.BadRequest(
        `Данные из формы не совпадают с данными в БД, пожалуйста, обновите страницу`
      );

    // Массив результатов
    let transerArray = [];

    for (let i = 0; i < products.length; i++) {
      try {
        let transfer;

        const transferProduct = {
          accounting_sn: products[i].accounting_sn,
          new_warehouse: warehouseTo[0].id,
          old_warehouse: warehouseFrom[0].id,
          id_product: products[i].id,
          sn: products[i].sn,
          transfer_count: products[i].countTransfer,
          count: products[i].count,
        };

        //let product = {...products[i], new_warehouse: warehouseTo[0].id, old_warehouse: warehouseFrom[0].id}

        if (products[i].accounting_sn) {
          transfer = await this.transferProductWithSN(
            transferProduct,
            id_author
          );
        }

        if (!products[i].accounting_sn) {
          transfer = await this.transferProductWithCount(
            transferProduct,
            id_author
          );
        }

        if (transfer) {
          transerArray.push({ ...products[i], status_transfer: true });
        } else {
          transerArray.push({ ...products[i], status_transfer: false });
        }
      } catch (e) {
        transerArray.push({
          ...products[i],
          status_transfer: false,
          error: e.message,
        });
      }
    }

    return transerArray;
  }
}

export default new ProductService();
