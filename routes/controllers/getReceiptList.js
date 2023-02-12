import pool from '../../db/db.js';

export async function getReceiptList(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });


  const receiptList = `
  SELECT
    mz_r.id_receipt,
    mz_r.id_product,
    (SELECT name FROM mz_nomenclature WHERE id = mz_r.id_nomenclature) AS name,
    (SELECT name_contragent FROM mz_contragents WHERE id_contragent = mz_r.id_contragent) AS contragent,
    (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_r.id_warehouse) AS warehouse_title,
    (SELECT category_title FROM mz_category WHERE id = mz_r.id_category) AS category_title,
    mz_r.count,
    mz_r.contract,
    mz_r.url_megaplan,
    mz_r.date,
    (SELECT mz_user_login FROM mz_users WHERE id = mz_r.id_author) AS author
  FROM mz_receipt mz_r
  `;
 

  pool
    .execute(receiptList)
    .then((result) => {
      console.log(result[0])
      res.json({ data: result[0] });
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: err });
    });
}
