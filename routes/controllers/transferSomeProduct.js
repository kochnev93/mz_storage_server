import pool from '../../db/db.js';
import jwt_decode from 'jwt-decode';
import ApiError from '../../exceptions/api-error.js';

export async function transferSomeProduct(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const { warehouseFrom, warehouseTo, products } = req.body;

  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  const updateProductNotSN = (product) => {
    // Если перемещаемый продукт уже имется на новом складе
    let errorCounter = 0;
    // Обновляем количество на старом складе
    const updateOldWarehouse = `UPDATE mz_products SET count=count-'${product.countTransfer}' WHERE id_product='${product.id}' AND id_warehouse='${warehouseFrom[0].id}'`;

    pool
      .execute(updateOldWarehouse)
      .then((result) => {
        // Обновляем количество на новом складе
        const updateNewWarehouse = `UPDATE mz_products SET count=count+'${product.countTransfer}' WHERE id_product='${product.id}' AND id_warehouse='${warehouseTo[0].id}'`;
        return pool.execute(updateNewWarehouse);
      })
      .then((result) => {
        const transferLog = `
        INSERT INTO mz_transfers 
        (id_product, old_id_warehouse, new_id_warehouse, count, id_author, date)
        VALUES ('${product.id}', '${warehouseFrom[0].id}', '${warehouseTo[0].id}', '${product.countTransfer}', '${id_author}', ( SELECT NOW() ) )`;
        return pool.execute(transferLog);
      })
      .catch(function (err) {
        errorCounter++;
        next(err);
      });

    return errorCounter === 0 ? true : false;
  };

  const insertProductNotSN = (product) => {
    // Если перемещаемый продукт НЕ имется на новом складе
    let errorCounter = 0;
    // Обновляем количество на старом складе
    const updateOldWarehouse = `UPDATE mz_products SET count=count-'${product.countTransfer}' WHERE id_product='${product.id}' AND id_warehouse='${warehouseFrom[0].id}'`;

    pool
      .execute(updateOldWarehouse)
      .then((result) => {
        const getValueProduct = `SELECT id_nomenclature, id_category, min_count, date_guarantee FROM mz_products WHERE id_warehouse='${warehouseFrom[0].id}' AND id_product='${product.id}'`;
        return pool.execute(getValueProduct);
      })
      .then((result) => {
        const { id_nomenclature, id_category, min_count, date_guarantee } =
          result[0][0];

        const transferProduct = `
          INSERT INTO mz_products 
          (id_product, id_nomenclature, id_category, id_warehouse, count, min_count, date_guarantee, date_create, id_author)
          VALUES ('${product.id}', '${id_nomenclature}', '${id_category}', '${
          warehouseTo[0].id
        }', '${product.countTransfer}', '${min_count}', '${new Date(
          date_guarantee
        ).toLocaleDateString()}', ( SELECT NOW() ), '${id_author}' )`;

        return pool.execute(transferProduct);
      })
      .then((result) => {
        const transferLog = `
        INSERT INTO mz_transfers 
        (id_product, old_id_warehouse, new_id_warehouse, count, id_author, date)
        VALUES ('${product.id}', '${warehouseFrom[0].id}', '${warehouseTo[0].id}', '${product.countTransfer}', '${id_author}', ( SELECT NOW() ) )`;

        return pool.execute(transferLog);
      })
      .catch(function (err) {
        errorCounter++;
        next(err);
      });

    return errorCounter === 0 ? true : false;
  };

  async function checkProducts(products) {

    for(let i = 0; i < products.length; i++){
      const query = `SELECT * FROM mz_products WHERE id_product='${
        products[i].id
      }' AND id_warehouse='${warehouseFrom[0].id}' AND ${
        products[i].accounting_sn
          ? `sn='${products[i].sn}'`
          : `count = '${products[i].count}'`
      }`;

      let array = await pool.execute(query).then((result) => {
        console.log('result-ppol', result[0]);
        return result[0].length;
      });

      if (array !== 1) return false;
    }

    return true
  }

  let check = await checkProducts(products);  

  if (check) {
    //При успешной проверке 

    products.forEach((product) => {
      if (product.accounting_sn) {
        //Серийный учет
        const updateQuery = `UPDATE mz_products SET id_warehouse='${warehouseTo[0].id}' WHERE sn='${product.sn}'`;
        pool
          .execute(updateQuery)
          .then((result) => {
            const transferLog = `
            INSERT INTO mz_transfers 
            (id_product, old_id_warehouse, new_id_warehouse, id_author, date)
            VALUES ('${product.id}', '${warehouseFrom[0].id}', '${warehouseTo[0].id}', '${id_author}', ( SELECT NOW() ) )`;
            return pool.execute(transferLog);
          })
          .catch(function (err) {
            next(err);
          });
      } else {
        // НЕ серийный учет

        // Провеярем иммется ли перемещаемый товар на новом складе
        const checkNewWarehouse = `SELECT * FROM mz_products WHERE id_product='${product.id}' AND id_warehouse='${warehouseTo[0].id}'`;
        let availabilityProduct;

        pool.execute(checkNewWarehouse).then((result) => {
          availabilityProduct = result[0].length !== 0 ? true : false;
        });

        console.log('availabilityProduct', availabilityProduct);
        availabilityProduct
          ? updateProductNotSN(product)
          : insertProductNotSN(product);
      }

      res.json({ data: 'Перемещение оформлено' });
    });
  } else {
    //При неудачной проверке
    try {
      throw ApiError.BadRequest(
        'Данные из формы не совпадают с данными в БД, пожалуйста, обновите страницу'
      );
    } catch (err) {
      next(err);
    }
  }

  // products.forEach((product) => {
  //   const query = `
  //   SELECT *
  //   FROM mz_products
  //   WHERE id_product='${product.id}' AND id_warehouse='${
  //     warehouseFrom[0].id
  //   }' AND ${
  //     product.accounting_sn ? `sn='${product.sn}'` : `count='${product.count}'`
  //   }`;

  //   console.log(query);

  //   pool
  //     .execute(query)
  //     .then((result) => {
  //       //console.log('RESULT----', result[0])
  //       if (result[0].length !== 1) {
  //         throw ApiError.BadRequest(
  //           'Данные из формы не совпадают с данными в БД, пожалуйста, обновите страницу'
  //         );
  //       }

  //       let updateQuery;

  //       if (product.accounting_sn) {
  //         //Серийный учет
  //         updateQuery = `UPDATE mz_products SET id_warehouse='${warehouseTo[0].id}' WHERE sn='${product.sn}'`;
  //       } else {
  //         // НЕ серийный учет
  //         const checkNewWarehouse = `SELECT * FROM mz_products WHERE id_product='${product.id}' AND id_warehouse='${warehouseTo[0].id}'`;
  //         let availabilityProduct;

  //         pool.execute(checkNewWarehouse).then((result) => {
  //           availabilityProduct = result[0].length !== 0 ? true : false;
  //         });
  //       }
  //     })
  //     .catch(function (err) {
  //       next(err);
  //     });
  // });

  //console.log(warehouseFrom, warehouseTo, products)
}
