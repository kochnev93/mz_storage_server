import pool from '../../db/db.js';
import ApiError from '../../exceptions/api-error.js';

export async function getProductHistoryById(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });

  const { id_product, id_warehouse, sn_accounting } = req.body;

  const result = [];

  const addItemsResult = (arr, type) => {
    // История приходов
    if (type === 'receipt') {
      arr.map((item) => {
        result.push({
          type: type,
          title: 'Оформлен приход',
          id_receipt: item.id_receipt,
          warehouse_receipt: item.warehouse_title,
          count: item.count,
          contract: item.contract,
          url_receipt: item.url_megaplan,
          author: item.mz_user_login,
          date_receipt: item.date.toLocaleString(),
        });
      });
    }

    //История перемещений
    if (type === 'transfer') {
      arr.map((item) => {
        result.push({
          type: type,
          title: 'Перемещение',
          id_transfer: item.id_transfer,
          old_warehouse: item.old_warehouse,
          new_warehouse: item.new_warehouse,
          count: item.count,
          author: item.mz_user_login,
          date: item.date.toLocaleString(),
        });
      });
    }

    //История расхода
    if (type === 'rate') {
      arr.map((item) => {
        result.push({
          type: type,
          title: 'Расход',
          id_rate: item.id_rate,
          old_warehouse: item.old_warehouse,
          new_warehouse: item.new_warehouse,
          count: item.count,
          author: item.mz_user_login,
          date: item.date.toLocaleString(),
        });
      });
    }

    // Отправляем после выполнения всех запросов
    if (type === 'rate') {
      res.json({ data: result });
    }
  };

  if (id_product && id_warehouse) {
    let historyReceipt;

    if (sn_accounting) {
      // historyReceipt = `
      // SELECT
      //   mz_r.id_receipt,
      //   mz_w.warehouse_title,
      //   mz_r.count,
      //   mz_r.contract,
      //   mz_r.url_megaplan,
      //   mz_r.date,
      //   mz_u.mz_user_login
      // FROM mz_receipt mz_r
      // JOIN mz_users mz_u ON mz_u.id = mz_r.id_author
      // JOIN mz_warehouse mz_w ON mz_w.id = mz_r.id_warehouse
      // JOIN mz_receipt_document mz_rd mz_w ON mz_rd.id_receipt = mz_r.id_receipt
      // WHERE mz_rd.id_product='${id_product}'
      // `;

      historyReceipt = `
      SELECT 
        mz_r.id_receipt,
        (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_r.id_warehouse) AS warehouse_title,
        mz_r.count,
        mz_r.contract,
        mz_r.url_megaplan,
        mz_r.date,
        (SELECT mz_user_login FROM mz_users WHERE id = mz_r.id_author) AS mz_user_login
      FROM mz_receipt_document mz_rd
      JOIN mz_receipt mz_r ON mz_r.id_receipt = mz_rd.id_receipt
      WHERE mz_rd.id_product='${id_product}'
      `;
    } else {
      historyReceipt = `
      SELECT 
        mz_r.id_receipt,
        (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_r.id_warehouse) AS warehouse_title,
        mz_r.count,
        mz_r.contract,
        mz_r.url_megaplan,
        mz_r.date,
        (SELECT mz_user_login FROM mz_users WHERE id = mz_r.id_author) AS mz_user_login
        FROM mz_receipt_document mz_rd
        JOIN mz_receipt mz_r ON mz_r.id_receipt = mz_rd.id_receipt
      WHERE mz_rd.id_product='${id_product}' AND mz_r.id_warehouse='${id_warehouse}'
      `;
    }
    pool
      .execute(historyReceipt)
      .then((res) => {
        console.log('HISTORY', res[0]);
        addItemsResult(res[0], 'receipt');

        let historyTransfer;

        if (sn_accounting) {
          historyTransfer = `
          SELECT 
            mz_t.id_transfer,
            (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.old_id_warehouse) AS old_warehouse,
            (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.new_id_warehouse) AS new_warehouse,
            mz_t.count,
            mz_t.date,
            (SELECT mz_user_login FROM mz_users WHERE id = mz_t.id_author) AS mz_user_login
          FROM mz_transfers mz_t
          WHERE mz_t.id_product='${id_product}'`;
        } else if (res[0].length !== 0) {
          historyTransfer = `
          SELECT 
            mz_t.id_transfer,
            (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.old_id_warehouse) AS old_warehouse,
            (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.new_id_warehouse) AS new_warehouse,
            mz_t.count,
            mz_t.date,
            (SELECT mz_user_login FROM mz_users WHERE id = mz_t.id_author) AS mz_user_login
          FROM mz_transfers mz_t
          WHERE mz_t.id_product='${id_product}' AND mz_t.old_id_warehouse='${id_warehouse}'`;
        } else {
          historyTransfer = `
          SELECT 
            mz_t.id_transfer,
            (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.old_id_warehouse) AS old_warehouse,
            (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.new_id_warehouse) AS new_warehouse,
            mz_t.count,
            mz_t.date,
            (SELECT mz_user_login FROM mz_users WHERE id = mz_t.id_author) AS mz_user_login
          FROM mz_transfers mz_t
          WHERE mz_t.id_product='${id_product}' AND mz_t.new_id_warehouse='${id_warehouse}'`;
        }

        return pool.execute(historyTransfer);
      })
      .then((res) => {
        addItemsResult(res[0], 'transfer');

        const historyRate = `
        SELECT 
          mz_r.id_rate,
          (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_r.id_old_warehouse) AS old_warehouse,
          (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_r.id_new_warehouse) AS new_warehouse,
          mz_r.count,
          mz_r.date,
          (SELECT mz_user_login FROM mz_users WHERE id = mz_r.id_author) AS mz_user_login
        FROM mz_rate mz_r
        WHERE mz_r.id_product='${id_product}' AND mz_r.id_old_warehouse='${id_warehouse}'`;

        return pool.execute(historyRate);
      })
      .then((res) => {
        addItemsResult(res[0], 'rate');
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
