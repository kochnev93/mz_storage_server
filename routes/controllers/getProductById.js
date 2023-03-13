import pool from '../../db/db.js';
import ApiError from '../../exceptions/api-error.js';


export async function getProductById(req, res, next){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const product_id = req.params.id;
  const {warehouse_id } = req.body;


  if (product_id && warehouse_id){
    const query = `
    SELECT 
      mz_p.id_product,
      mz_n.name, 
      mz_w.warehouse_title, 
      mz_c.category_title,
      mz_p.sn,
      mz_p.count,
      mz_n.comment, 
      mz_n.accounting_sn
    FROM mz_products mz_p
    JOIN mz_warehouse mz_w ON mz_w.id = '${warehouse_id}'
    JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
    JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
    WHERE mz_p.id_product = '${product_id}' AND mz_p.id_warehouse='${warehouse_id}'
    `;

    pool
      .execute(query)
      .then((result) => {
        const data = result[0][0];
        console.log(data);
        res.json({ data: data});
      })
      .catch(function (err) {
        console.log(err.message);

        if(err.code === 'ECONNREFUSED'){
          throw ApiError.NoConnectDB('Нет подключения к БД', err)
        }

      })
      .catch(function (err) {
        next(err)
      });
  }

};
