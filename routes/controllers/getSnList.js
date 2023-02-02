import pool from '../../db/db.js';
import ApiError from '../../exceptions/api-error.js';


export async function getSnList(req, res, next){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const {product_id, warehouse_id } = req.body;

  if (product_id && warehouse_id){

    const getSN = `
    SELECT mz_sn.sn, mz_sn.id_warehouse, mz_w.warehouse_title
    FROM mz_sn
    JOIN mz_warehouse mz_w ON mz_w.id = mz_sn.id_warehouse
    WHERE mz_sn.id_product = '${product_id}'
    `;

    pool
      .execute(getSN)
      .then((result) => {
        const data = result[0];
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
