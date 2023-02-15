import pool from '../../../db/db.js';

export async function getReceiptInfo(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const id_receipt = req.params.id_receipt;

  let response;

  const receiptInfo = `
  SELECT
    mz_r.id_receipt,
    (SELECT name_contragent FROM mz_contragents WHERE id_contragent = mz_r.id_contragent) AS contragent,
    (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_r.id_warehouse) AS warehouse_title,
    (SELECT category_title FROM mz_category WHERE id = mz_r.id_category) AS category_title,
    mz_r.count,
    mz_r.contract,
    mz_r.url_megaplan,
    mz_r.date,
    (SELECT mz_user_login FROM mz_users WHERE id = mz_r.id_author) AS author
  FROM mz_receipt mz_r
  WHERE mz_r.id_receipt=${id_receipt}
  `;

  const stringIDProducts = `SELECT id_product FROM mz_receipt_document WHERE id_receipt='${id_receipt}'`;

  pool
    .execute(receiptInfo)
    .then((result) => {
      response = { ...result[0][0] };
      return pool.execute(stringIDProducts);
    })
    .then((result) => {
      const str_products = result[0].map((item) => item.id_product).join();

      const receiptProduct = `
        SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.sn, mz_p.count, mz_n.accounting_sn
        FROM mz_products mz_p
        JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
        JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
        JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
        WHERE mz_p.id_product IN (${
          str_products.length !== 0 ? str_products : 0
        })
        `;

      return pool.execute(receiptProduct);
    })
    .then((result) => {
      response.products = result[0];
      res.json({ data: response });
    })
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message });
    });
}
