import pool from '../../../db/db.js';
import jwt_decode from 'jwt-decode';

export async function receiptProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const { warehouse, product, sn, count, contract, url, vendor } = req.body;

  // Информация о пользователе
  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  // Последний id продукта в БД
  const queryLastIndex = `SELECT MAX(id_product) AS id FROM mz_products`;
  let lastIndex = null;

  // Формируем массив с серийными номерами в запись для sql
  const getSNForQuery = (sn) => {
    const result = sn.map((item, index) => {
      return `('${lastIndex + index}', '${product[0].id_nomenclature}', '${
        product[0].category
      }', '${warehouse[0].id}', '${item}', ( SELECT NOW() ), '${id_author}')`;
    });

    return result.join();
  }; 

  // Формируем массив с серийными номерами в запись для sql
  const getReceiptForQuery = (sn) => {
    const result = sn.map((item, index) => {
      return `('${lastIndex + index}', '${
        product[0].id_nomenclature
      }', ${0}, '${warehouse[0].id}', '${product[0].category}', '${
        product[0].accounting_sn ? sn.length : count
      }', '${contract}', '${url}', ( SELECT NOW() ), '${id_author}')`;
    });

    return result.join();
  };

  // Добавляем товары в список товаров - НЕ серийный учет

  if (product[0].accounting_sn) {
    pool
      .execute(queryLastIndex)
      .then((result) => {
        lastIndex = result[0][0].id + 1;

        const queryAddReceipt = `
        INSERT INTO mz_receipt (
          id_product, 
          id_nomenclature, 
          id_contragent, 
          id_warehouse, 
          id_category, 
          count, 
          contract, 
          url_megaplan, 
          date, 
          id_author ) 
        VALUES ${getReceiptForQuery(sn)}`;

        return pool.execute(queryAddReceipt);
      })
      .then((result) => {
        const AddListProduct = `
        INSERT INTO mz_products
        (id_product, id_nomenclature, id_category, id_warehouse, sn, date_create, id_author ) 
        VALUES ${getSNForQuery(sn)}`;

        res.json({ data: 'Приход оформлен' });

        return pool.execute(AddListProduct);
      })
      .catch(function (err) {
        console.log(err);
        throw ApiError.NoConnectDB('Нет подключения к БД', err);
      })
      .catch(function (err) {
        next(err);
      });
  } else {
    pool
      .execute(queryLastIndex)
      .then((result) => {
        lastIndex = result[0][0].id + 1;

        const queryAddReceipt = `
        INSERT INTO mz_receipt
        (id_product, id_nomenclature, id_contragent, id_warehouse, id_category, count, contract, url_megaplan, date, id_author ) 
        VALUES ('${lastIndex}', '${product[0].id_nomenclature}', '${0}', '${warehouse[0].id}', '${
          product[0].category}', '${count}', '${contract}', '${url}', ( SELECT NOW() ), '${id_author}')`;

        return pool.execute(queryAddReceipt);
      })
      .then((result) => {
        const AddListRateProduct = `
        INSERT INTO mz_products
        (id_product, id_nomenclature, id_category, id_warehouse, count, date_create, id_author ) 
        VALUES ('${lastIndex}', '${product[0].id_nomenclature}', '${product[0].category}', '${warehouse[0].id}', '${count}', ( SELECT NOW() ), '${id_author}')`;

        res.json({ data: 'Приход оформлен' });
        return pool.execute(AddListRateProduct);
      })
      .catch(function (err) {
        console.log(err);
        throw ApiError.NoConnectDB('Нет подключения к БД', err);
      })
      .catch(function (err) {
        next(err);
      });
  }
}
