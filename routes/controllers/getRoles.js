import pool from '../../db/db.js';

export async function getRoles(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const query = 'SELECT * FROM `mz_user_roles` ORDER BY id_role';

  pool
    .execute(query)
    .then((result) => {
      const data = result[0].map( option => {
        return {
            id: option.id_role,
            title: option.role,
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
