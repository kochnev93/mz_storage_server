import pool from '../../db/db.js';

export async function getContragents(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const query = 'SELECT id_contragent, name_contragent, inn_contragent FROM `mz_contragents` ORDER BY name_contragent';

  pool
    .execute(query)
    .then((result) => {
      const data = result[0].map( option => {
        return {
            id: option.id_contragent,
            title: `${option.name_contragent} (${option.inn_contragent})`,
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
