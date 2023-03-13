import pool from '../../db/db.js';
import jwt_decode from 'jwt-decode';

export async function addComment(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const { product_id, comment } = req.body;


  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;


  const addComment = `
  INSERT INTO mz_comments
  (id_product, comment, id_author, date)
  VALUES ('${product_id}', '${comment}', '${id_author}', (SELECT NOW()) )
  `;


  pool
    .execute(addComment)
    .then((result) => {
      

      const getLastComment = `
      SELECT
        id_comment,
        comment,
        (SELECT mz_user_login FROM mz_users WHERE id = mz_c.id_author) AS author,
        date
      FROM mz_comments mz_c
      WHERE id_author ='${id_author}'
      ORDER BY id_comment DESC LIMIT 1
      `;

      return pool.execute(getLastComment)
     
    })
    .then(result => {
      res.json({ data: result[0][0]});
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: err });
    });
}
