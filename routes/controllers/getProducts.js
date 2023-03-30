import pool from '../../db/db.js';

export async function getProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const warehouse = req.body.warehouse.map((item) => item.id).join();
  const category = req.body.category.map((item) => item.id).join();
  const search = req.body.search;

  let searchQuery;

  if (search !== null && search !== '') {
    searchQuery = search;
  }

  const requestСonditions = () => {
    const temp = [warehouse, category, search];
    console.log('TEMP', temp);

    let result;

    // true - если все фильтры пустые
    const nullCounter = temp.every((item) => item === null || item === '');

    if (nullCounter) {
      res.json({ error: 'Ничего не найдено, задайте параметры поиска' });
    } else {
      result = 'WHERE';

      if (warehouse) {
        result = `${result} mz_p.id_warehouse IN (${warehouse})`;
      }

      if (category) {
        result = `${result} ${warehouse ? 'AND' : ''} mz_p.id_category IN (${category})`;
      }

      if (search) {
        result = `${result} ${warehouse || category ? 'AND' : ''} (mz_n.name LIKE '%${search}%' OR mz_p.sn LIKE '%${search}%')`;
      }
    }

    return result;
  };

  const test2 = `
  SELECT mz_p.id_product, mz_p.id_nomenclature, mz_n.name, mz_p.id_warehouse, mz_w.warehouse_title, mz_p.id_category, mz_c.category_title, mz_p.sn, mz_p.count, mz_n.accounting_sn
  FROM mz_products mz_p
  JOIN mz_warehouse mz_w ON mz_p.id_warehouse = mz_w.id
  JOIN mz_category mz_c ON mz_p.id_category = mz_c.id
  JOIN mz_nomenclature mz_n ON mz_p.id_nomenclature = mz_n.id
  ${requestСonditions()}`;

  pool
    .execute(test2)
    .then((result) => {
      console.log(result[0]);
      res.json({ data: result[0] });
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: err });
    });
}
