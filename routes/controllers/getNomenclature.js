import pool from '../../db/db.js';
import ApiError from '../../exceptions/api-error.js';

export async function getNomenclature(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const queryNomenclature = ` 
  SELECT mz_n.id, mz_n.name, mz_n.id_category, mz_c.category_title, mz_n.accounting_sn, mz_u.unit, mz_n.date_create, mz_users.mz_user_login, mz_n.comment
  FROM mz_nomenclature mz_n
  JOIN mz_category mz_c ON mz_n.id_category = mz_c.id
  JOIN mz_unit mz_u ON mz_n.id_unit = mz_u.id
  JOIN mz_users ON mz_n.author = mz_users.id
  `;

  pool
    .execute(queryNomenclature)
    .then((result) => {
      const data = result[0];
      res.json({ data: data });
    })
    .catch(function (err) {
      console.log(err.message);

      if (err.code === 'ECONNREFUSED') {
        throw ApiError.NoConnectDB('Нет подключения к БД', err);
      }
    })
    .catch(function (err) {
      next(err);
    });
}
