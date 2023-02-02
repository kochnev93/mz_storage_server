import pool from '../../../db/db.js';
import jwt_decode from 'jwt-decode';

export async function receiptProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const { warehouse, product, sn, count, contract, url, vendor } = req.body;

  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  // Формируем массив с серийными номерами в запись для sql
  const getSNForQuery = (sn) => {
    // Номер последнего прихода
    const id_last_receipt = `(SELECT id_receipt FROM mz_receipt WHERE id_author='${id_author}' ORDER BY id_receipt DESC LIMIT 1)`;

    const result = sn.map((item) => {
      return `('${product[0].id_nomenclature}', ${id_last_receipt}, '${product[0].category}', '${warehouse[0].id}', '${item}', ( SELECT NOW() ), '${id_author}')`;
    });

    return result.join();
  };

  // Добавляем запись о приходе
  const queryAddReceipt = `
  INSERT INTO mz_receipt
  (id_nomenclature, id_contragent, id_warehouse, id_category, count, contract, url_megaplan, date, id_author ) 
  VALUES ('${product[0].id_nomenclature}', '${0}', '${warehouse[0].id}', '${
    product[0].category
  }', '${
    product[0].accounting_sn ? sn.length : count
  }', '${contract}', '${url}', ( SELECT NOW() ), '${id_author}')
  `;

  // Добавляем товары в список товаров - серийный учет
  const AddListProduct = `
    INSERT INTO mz_products
    (id_nomenclature, id_receipt, id_category, id_warehouse, sn, date_create, id_author ) 
    VALUES ${getSNForQuery(sn)}`;

  // Добавляем товары в список товаров - серийный учет
  const AddListRateProduct = `
  INSERT INTO mz_products
  (id_nomenclature, id_receipt, id_category, id_warehouse, count, date_create, id_author ) 
  VALUES ('${product[0].id_nomenclature}', ${`(SELECT id_receipt FROM mz_receipt WHERE id_author='${id_author}' ORDER BY id_receipt DESC LIMIT 1)`}, '${product[0].category}', '${warehouse[0].id}', '${count}', ( SELECT NOW() ), '${id_author}')`;

  if (product[0].accounting_sn) {
    pool
      .execute(queryAddReceipt)
      .then((result) => {
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
      .execute(queryAddReceipt)
      .then((result) => {
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
