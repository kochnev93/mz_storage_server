import pool from '../../db/db.js';
import ApiError from '../../exceptions/api-error.js';

export async function getProductHistoryById(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const productID = req.params.id;

  const result = [];

  const addItemsResult = (arr, type) => {
    // История приходов
    if(type === 'receipt'){
      arr.map((item) => {
        result.push({
          type: type,
          title: 'Оформлен приход',
          id_receipt: item.id_receipt,
          warehouse_receipt: item.warehouse_title,
          contract: item.contract,
          url_receipt: item.url_megaplan,
          author: item.mz_user_login,
          date_receipt: item.date.toLocaleString(),
        });
      });
    }

    //История перемещений
    if(type === 'transfer'){
      arr.map((item) => {
        result.push({
          type: type,
          title: 'Перемещение',
          id_transfer: item.id_transfer,
          old_warehouse: item.old_warehouse,
          new_warehouse: item.new_warehouse,
          author: item.mz_user_login,
          date: item.date.toLocaleString(),
        });
      });
    }

    // Отправляем после выполнения всех запросов
    if(type === 'transfer'){
      res.json({ data: result });
    }

  };

  if (productID) {
    const historyTransfer = `
    SELECT 
      mz_t.id_transfer,
      (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.old_id_warehouse) AS old_warehouse,
      (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.new_id_warehouse) AS new_warehouse,
      mz_t.date,
      (SELECT mz_user_login FROM mz_users WHERE id = mz_t.id_author) AS mz_user_login
    FROM mz_transfers mz_t
    WHERE mz_t.id_product IN (${productID})`;

    // const historyReceipt = `
    // SELECT 
    //   mz_r.id_receipt,
    //   mz_w.warehouse_title, 
    //   mz_r.contract,
    //   mz_r.url_megaplan,
    //   mz_r.date,
    //   mz_u.mz_user_login
    // FROM mz_products mz_p
    // JOIN mz_receipt mz_r ON mz_p.id_receipt = mz_r.id_receipt
    // JOIN mz_users mz_u ON mz_u.id = mz_r.id_author
    // JOIN mz_warehouse mz_w ON mz_w.id = mz_r.id_warehouse
    // WHERE mz_p.id_product IN (${productID})
    // `;

    const historyReceipt = `
    SELECT 
      mz_r.id_receipt,
      mz_w.warehouse_title, 
      mz_r.contract,
      mz_r.url_megaplan,
      mz_r.date,
      mz_u.mz_user_login
    FROM mz_receipt mz_r
    JOIN mz_users mz_u ON mz_u.id = mz_r.id_author
    JOIN mz_warehouse mz_w ON mz_w.id = mz_r.id_warehouse
    WHERE mz_r.id_product IN (${productID})
    `;

    pool
      .execute(historyReceipt)
      .then((res) => {
        console.log(res[0]);
        addItemsResult(res[0], 'receipt');
        return pool.execute(historyTransfer);
      })
      .then((res) => {
        console.log(res[0]);
        addItemsResult(res[0], 'transfer');
      })
      .catch(function (err) {
        console.log(err.message);

        if (err.code === 'ECONNREFUSED') {
          throw ApiError.NoConnectDB('Нет подключения к БД', err);
        }
      })
      .catch(function (err) {
        next(err);
      });
  }
}
