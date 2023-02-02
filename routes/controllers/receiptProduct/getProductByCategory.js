import pool from '../../../db/db.js';

export async function getProductByCategory(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const category_id = req.params.category_id;
 
  let query;

  if( category_id == 0){
     query = `SELECT id, name, id_category, accounting_sn, date_create, author FROM mz_nomenclature ORDER BY id`;
  } else{
     query = `SELECT id, name, id_category, accounting_sn, date_create, author FROM mz_nomenclature WHERE id_category='${category_id}' ORDER BY id`;
  }


  pool
    .execute(query)
    .then((result) => {
      const data = result[0].map( option => {
        return {
            id_nomenclature: option.id,
            title: option.name,
            isCheked: false,
            category: option.id_category,
            accounting_sn: option.accounting_sn ? true : false,
            author: option.author,
            date: option.date_create.toLocaleString(),
        }
      });

      res.json({ data: data});
    })
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message});
    });
};