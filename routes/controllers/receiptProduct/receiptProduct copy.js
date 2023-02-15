import pool from '../../../db/db.js';
import jwt_decode from 'jwt-decode';
import ApiError from '../../../exceptions/api-error.js';


export async function receiptProduct(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const {
    warehouse,
    product,
    sn,
    count,
    min_count,
    contract,
    url,
    contragent,
    newContragentName,
    newContragentINN,
    guarantee,
  } = req.body;

  // Информация о пользователе
  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  // Последний id продукта в БД 
  const queryLastIndex = `SELECT MAX(id_product) AS id FROM mz_products`;
  let lastIndex = null;

  // Формируем SQL запись значений для MZ_PRODUCTS
  // Серийный учет
  const getSNForQuery = (sn) => {
    const result = sn.map((item, index) => {
      return `(
        '${lastIndex + index}', 
        '${product[0].id_nomenclature}', 
        '${product[0].category}', 
        '${warehouse[0].id}', 
        '${item}', 
        '${guarantee ? guarantee : '1900-01-01'}', 
        ( SELECT NOW() ), 
        '${id_author}'
      )`;
    });

    return result.join();
  };

  // Формируем массив с серийными номерами в запись для sql
  const getReceiptForQuery = (sn) => {
    const result = sn.map((item, index) => {
      return `(
        '${lastIndex + index}', 
        '${product[0].id_nomenclature}', 
        ${
          !contragent
            ? `(SELECT id_contragent FROM mz_contragents WHERE inn_contragent='${newContragentINN}')`
            : contragent[0].id
        }, 
        '${warehouse[0].id}', 
        '${product[0].category}', 
        '${product[0].accounting_sn ? sn.length : count}', 
        '${contract}', 
        '${url}', 
        ( SELECT NOW() ), 
        '${id_author}'
      )`;
    });

    return result.join();
  };

  // Добавление нового контрагента
  if (!contragent) {
    const queryAddContragent = `
    INSERT INTO mz_contragents (
      name_contragent, 
      inn_contragent, 
      date, 
      author) 
    VALUES (
      '${newContragentName}',
      '${newContragentINN}',
      ( SELECT NOW() ), 
      '${id_author}'
    )`;

    pool
      .execute(queryAddContragent)
      .then((result) => {})
      .catch(function (err) {
        throw ApiError.BadRequest('Ошибка при добавлении контрагента', err);
      })
      .catch(function (err) {
        next(err);
      });
  }


  // Начало
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
        (id_product, id_nomenclature, id_category, id_warehouse, sn, date_guarantee, date_create, id_author ) 
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
          id_author 
        ) 
        VALUES (
          '${lastIndex}', 
          '${product[0].id_nomenclature}', 
          ${
            !contragent
              ? `(SELECT id_contragent FROM mz_contragents WHERE inn_contragent='${newContragentINN}')`
              : contragent[0].id
          }, 
          '${warehouse[0].id}', 
          '${product[0].category}', 
          '${count}', 
          '${contract}', 
          '${url}', 
          ( SELECT NOW() ), 
          '${id_author}'
          )`;

        return pool.execute(queryAddReceipt);
      })
      .then((result) => {
        const AddListRateProduct = `
        INSERT INTO mz_products (
          id_product, 
          id_nomenclature, 
          id_category, 
          id_warehouse, 
          count,
          min_count,
          date_guarantee,   
          date_create, 
          id_author 
        ) 
        VALUES (
          '${lastIndex}', 
          '${product[0].id_nomenclature}', 
          '${product[0].category}', 
          '${warehouse[0].id}', 
          '${count}',
          '${min_count}', 
          '${guarantee ? guarantee : '1900-01-01'}',  
          ( SELECT NOW() ), 
          '${id_author}'
        )`;

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
