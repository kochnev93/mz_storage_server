import pool from '../../db/db.js';

export async function getComments(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const product_id = req.params.id;
  

  const comments = `
  SELECT
    id_comment,
    comment,
    (SELECT mz_user_login FROM mz_users WHERE id = mz_c.id_author) AS author,
    date
  FROM mz_comments mz_c
  WHERE id_product='${product_id}'
  `;
 

  pool
    .execute(comments)
    .then((result) => {
      res.json({ data: result[0] });
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: err });
    });
}
