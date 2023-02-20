import pool from '../../db/db.js';

export async function getProductByWarehouseID(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const warehouse_id = req.params.id;
  console.log(warehouse_id);


    const test2 = `
  SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.id_warehouse, mz_w.warehouse_title, mz_p.id_category, mz_c.category_title, mz_p.sn, mz_p.count, mz_n.accounting_sn
  FROM mz_products mz_p
  JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
  JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
  JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
  WHERE id_warehouse='${warehouse_id}'`; 


  pool
    .execute(test2)
    .then((result) => {
      const data = result[0].map( option => {
        return {
            id: option.id_product,
            name: option.name,
            sn: option.sn,
            count: option.count,
            accounting_sn: option.accounting_sn,
            title: `${option.name} ${option.accounting_sn ? `(${option.sn})` : ''}`,
            isCheked: false,
        }
      });

      res.json({ data: data});
    })
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message});
    });
}


//   const test2 = `
//   SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.id_warehouse, mz_w.warehouse_title, mz_p.id_category, mz_c.category_title, mz_p.sn, mz_p.count, mz_n.accounting_sn
//   FROM mz_products mz_p
//   JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
//   JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
//   JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
//   ${requestСonditions()}`;

//   pool
//     .execute(test2)
//     .then((result) => {
//       console.log(result[0]);
//       res.json({ data: result[0] });
//     })
//     .catch(function (err) {
//       console.log(err);
//       res.json({ error: err });
//     });
//}
