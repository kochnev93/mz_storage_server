import pool from '../../db/db.js';

export async function getCategory(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const query = 'SELECT * FROM `mz_category` ORDER BY category_title';

  pool
    .execute(query)
    .then((result) => {
      const data = result[0].map( option => {
        return {
            id: option.id,
            title: option.category_title,
            isCheked: false,
        }
      });

      res.json({ data: data});
    })
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message});
    });
};
