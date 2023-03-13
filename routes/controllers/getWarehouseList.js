import pool from '../../db/db.js';

export async function getWarehouseList(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const query = 'SELECT id, warehouse_number, warehouse_title, warehouse_adress FROM `mz_warehouse` ORDER BY warehouse_title';

  pool
    .execute(query)
    .then((result) => {
      res.json({ data: result[0]});
    })
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message});
    });
};
