import pool from '../../db/db.js';
import jwt_decode from 'jwt-decode';

export async function upload(req, res){
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

try{
  const file = req.file

  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  const query = `UPDATE mz_users SET mz_user_img='${file.filename}' WHERE id='${id_author}'`;


  pool.execute(query)
    .then(result => {res.json({data: 'Фото загружено', filename: file.filename})})
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message });
    });

} catch (error){
  console.log(error)
}


};
