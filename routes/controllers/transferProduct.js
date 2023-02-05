import pool from '../../db/db.js';
import jwt_decode from 'jwt-decode';

export async function transferProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const {
    accounting_sn,
    new_warehouse,
    old_warehouse,
    id_product,
    sn,
    transfer_count,
    count,
  } = req.body;

  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  if (accounting_sn) {
    const updateWarehouse = `UPDATE mz_products SET id_warehouse='${new_warehouse}', id_author='${id_author}' WHERE sn='${sn}'`;
    const addTransfer = `INSERT INTO mz_transfers (id_product, old_id_warehouse, new_id_warehouse, id_author, date) VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${id_author}', ( SELECT NOW() )) `;

    pool
      .execute(updateWarehouse)
      .then((result) => {
        return pool.execute(addTransfer);
      })
      .then((result) => {
        res.json({ data: 'Перемещение выполнено' });
      })
      .catch(function (err) {
        console.log(err.message);
        res.json({ error: err.message });
      });
  } else {
    const checkCount = `SELECT count FROM mz_products WHERE id_warehouse='${old_warehouse}' AND id_product='${id_product}'`;

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

        const checkNewWarehouse = `SELECT count FROM mz_products WHERE id_warehouse='${new_warehouse}' AND id_product='${id_product}'`;
        return pool.execute(checkNewWarehouse);
      })
      .then((result) => {
        const availabilityProduct = result[0].length === 0 ? false : true;

        if (!availabilityProduct) {
          console.log('Данного товара на новом складе нет');

          const getValue = `SELECT id_nomenclature, id_category FROM mz_products WHERE id_warehouse='${old_warehouse}' AND id_product='${id_product}'`;

          pool
            .execute(getValue)
            .then((result) => {
              console.log('DATA', result[0][0]);
              const { id_nomenclature, id_category } = result[0][0];
              const transferProduct = `
                INSERT INTO mz_products 
                (id_product, id_nomenclature, id_category, id_warehouse, count, date_create, id_author)
                VALUES ('${id_product}', '${id_nomenclature}', '${id_category}', '${new_warehouse}', '${transfer_count}', ( SELECT NOW() ), '${id_author}' )`;

              return pool.execute(transferProduct);
            })
            .then((result) => {
              const subtractionCount = `UPDATE mz_products SET count=count-'${transfer_count}' WHERE id_product='${id_product}' AND id_warehouse='${old_warehouse}'`;
              return pool.execute(subtractionCount);
            })
            .then((result) => {
              const transferLog = `
              INSERT INTO mz_transfers 
              (id_product, old_id_warehouse, new_id_warehouse, count, id_author, date)
              VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${transfer_count}', '${id_author}', ( SELECT NOW() ) )`;
              return pool.execute(transferLog)
            })
            .then((result) => {
              res.json({ data: 'Товар перемещен' });
            })
            .catch(function (err) {
              console.log(err.message);
              res.json({ error: err.message });
            });
        } else {
          console.log('Данный товар есть на новом складе');

          const updateCount = `UPDATE mz_products SET count=count+'${transfer_count}' WHERE id_product='${id_product}' AND id_warehouse='${new_warehouse}'`;
          const subtractionCount = `UPDATE mz_products SET count=count-'${transfer_count}' WHERE id_product='${id_product}' AND id_warehouse='${old_warehouse}'`;

          pool
            .execute(updateCount)
            .then((result) => {
              return pool.execute(subtractionCount);
            })
            .then((result) => {
              const transferLog = `
              INSERT INTO mz_transfers 
              (id_product, old_id_warehouse, new_id_warehouse, count, id_author, date)
              VALUES ('${id_product}', '${old_warehouse}', '${new_warehouse}', '${transfer_count}', '${id_author}', ( SELECT NOW() ) )`;
              return pool.execute(transferLog)
            })
            .then((result) => {
              res.json({ data: 'Товар перемещен' });
            })
            .catch(function (err) {
              console.log(err.message);
              res.json({ error: err.message });
            });
        }
      })
      .catch(function (err) {
        console.log('CATCH', err, err.message);
        res.json({ error: err.message });
      });
  }
}
