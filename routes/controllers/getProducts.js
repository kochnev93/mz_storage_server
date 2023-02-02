import pool from '../../db/db.js';

export async function getProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const warehouse = req.body.warehouse.map((item) => item.id).join();
  const category = req.body.category.map((item) => item.id).join();

  const test = `
  SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.id_warehouse, mz_w.warehouse_title, mz_p.id_category, mz_c.category_title, mz_p.sn, mz_p.count, mz_n.accounting_sn
  FROM mz_products mz_p
  JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
  JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
  JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
  WHERE mz_p.id_warehouse IN (${warehouse}) AND mz_p.id_category IN (${category})
  `;
 

  // const queryProducts = `
  // SELECT mz_n.id, mz_n.name, mz_sn.id_warehouse, mz_w.warehouse_title, mz_sn.id_category, mz_c.category_title, mz_sn.sn, mz_n.accounting_sn
  // FROM mz_sn
  // JOIN mz_warehouse mz_w ON mz_sn.id_warehouse = mz_w.id
  // JOIN mz_category mz_c ON mz_sn.id_category = mz_c.id
  // JOIN mz_nomenclature mz_n ON mz_sn.id_product = mz_n.id
  // WHERE mz_sn.id_warehouse IN (${warehouse}) AND mz_sn.id_category IN (${category})
  // `;


  // const querySnProducts = `
  // SELECT mz_n.id, mz_n.name, mz_sn.id_warehouse, mz_w.warehouse_title, mz_sn.id_category, mz_c.category_title, mz_sn.sn, mz_n.accounting_sn
  // FROM mz_sn
  // JOIN mz_warehouse mz_w ON mz_sn.id_warehouse = mz_w.id
  // JOIN mz_category mz_c ON mz_sn.id_category = mz_c.id
  // JOIN mz_nomenclature mz_n ON mz_sn.id_product = mz_n.id
  // WHERE mz_sn.id_warehouse IN (${warehouse}) AND mz_sn.id_category IN (${category})
  // `;

  // const queryRateProducts = `
  // SELECT mz_n.id, mz_n.name, mz_rate.id_warehouse, mz_w.warehouse_title, mz_rate.id_category, mz_c.category_title, mz_rate.count, mz_n.accounting_sn
  // FROM mz_rate_products mz_rate
  // JOIN mz_warehouse mz_w ON mz_rate.id_warehouse = mz_w.id
  // JOIN mz_category mz_c ON mz_rate.id_category = mz_c.id
  // JOIN mz_nomenclature mz_n ON mz_rate.id_product = mz_n.id
  // WHERE mz_rate.id_warehouse IN (${warehouse}) AND mz_rate.id_category IN (${category})
  // `;

  // const listProducts = [];

  // pool
  //   .execute(querySnProducts)
  //   .then((result) => {
  //     listProducts.push(...result[0]);
  //     //console.log('SN', listProducts);
  //     return pool.execute(queryRateProducts);
  //   })
  //   .then((result) => {
  //     listProducts.push(...result[0]);
  //     //console.log('RATE', listProducts);
  //     res.json({ data: listProducts });
  //   })
  //   .catch(function (err) {
  //     console.log(err);
  //     res.json({ error: err });
  //   });


  pool
    .execute(test)
    .then((result) => {
      console.log(result[0])
      res.json({ data: result[0] });
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: err });
    });
}
