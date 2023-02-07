import pool from '../../db/db.js';
import jwt_decode from 'jwt-decode';

export async function rateProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const { new_warehouse, old_warehouse, id_product, rate_count, count } =
    req.body;

  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  const checkCount = `SELECT count FROM mz_products WHERE id_product='${id_product}' AND id_warehouse='${old_warehouse}'`;

  pool
    .execute(checkCount)
    .then((result) => {
      // Если ничего не найдено
      if (result[0].length === 0) {
        throw Error('Ошибка 50. Пожалуйста, обновите страницу');
      }

      const currentCountDB = result[0][0].count;
      console.log('COUNT', currentCountDB);

      // Если кол-во товара в БД не совпадает с кол-вом, отображаемым на клиенте
      if (currentCountDB != count) {
        throw Error('Ошибка 51. Пожалуйста, обновите страницу');
      }

      const updateCount = `UPDATE mz_products SET count=count-'${rate_count}' WHERE id_product='${id_product}' AND id_warehouse='${old_warehouse}'`;
      return pool.execute(updateCount);
    })
    .then((result) => {
      const addLogRate = `
    INSERT INTO mz_rate 
    (id_product, id_old_warehouse, id_new_warehouse, count, date, id_author)
    VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${rate_count}', ( SELECT NOW() ), '${id_author}' )`;
      return pool.execute(addLogRate);
    })
    .then((result) => {
      res.json({ data: `Расход в количестве ${rate_count}шт. выполнен` });
    })
    .catch(function (err) {
      console.log(err.message);
      res.json({ error: err.message });
    });
}
