import pool from '../../db/db.js';
import ApiError from '../../exceptions/api-error.js';

function requestСonditions(filter) {
  console.log('FILTER++++++++++++', filter)

  // Данный метод формирует условия поиска для SQL запроса
  const warehouseFrom = filter?.warehouseFrom?.map((item) => item.id).join();
  const warehouseTo = filter?.warehouseTo?.map((item) => item.id).join();
  const dateBegin = filter?.dateBegin;
  const dateEnd = filter?.dateEnd;
  const search = filter?.search;

  let warehouseFromQuery = warehouseFrom?.length
    ? `mz_t.old_id_warehouse IN (${warehouseFrom})`
    : '';
  let warehouseToQuery = warehouseTo?.length
    ? `mz_t.new_id_warehouse IN (${warehouseTo})`
    : '';
  let searchQuery = search
    ? `(mz_t.sn LIKE '%${search}%' OR mz_t.id_product LIKE '%${search}%')`
    : '';

  let dateQuery;
  if (dateBegin && dateEnd) {
    dateQuery = `mz_t.date > '${dateBegin}' AND mz_t.date < '${dateEnd}'`;
  } else if (dateBegin) {
    dateQuery = `mz_t.date > '${dateBegin}'`;
  } else if (dateEnd) {
    dateQuery = `mz_t.date < '${dateEnd}'`;
  }

  // true - если все фильтры пустые
  const searchIsNull = [warehouseFromQuery, warehouseToQuery, searchQuery, dateQuery].every(
    (item) => item === undefined || item === ''
  );
  console.log(searchIsNull)
  if (searchIsNull) return '';


  // Формирование поиска для SQL
  let result = 'WHERE ';
  result += warehouseFromQuery ? warehouseFromQuery : '';

  if (warehouseFromQuery) {
    result += warehouseToQuery ? ` AND ${warehouseToQuery}` : '';
  } else {
    result += warehouseToQuery;
  }

  if (warehouseFromQuery || warehouseToQuery) {
    result += dateQuery ? ` AND ${dateQuery}` : '';
  } else {
    result += dateQuery;
  }

  if (warehouseFromQuery || warehouseToQuery || dateQuery) {
    result += searchQuery ? ` AND ${searchQuery}` : '';
  } else {
    result += searchQuery;
  }

  return result;
}

export async function getTransfers(req, res, next) {
  const query = `
  SELECT 
  mz_t.id_transfer,
  (SELECT name FROM mz_nomenclature WHERE id=(SELECT id_nomenclature FROM mz_products WHERE id_product=mz_t.id_product LIMIT 1)) AS name,
  (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.old_id_warehouse) AS old_warehouse,
  (SELECT warehouse_title FROM mz_warehouse WHERE id = mz_t.new_id_warehouse) AS new_warehouse,
  mz_t.count,
  (SELECT sn FROM mz_products WHERE id_product = mz_t.id_product LIMIT 1) AS sn,
  mz_t.date,
  (SELECT mz_user_login FROM mz_users WHERE id = mz_t.id_author) AS mz_user_login
  FROM mz_transfers mz_t
  ${requestСonditions(req.body)}
  order by date DESC
  `;

  let transfers = await pool
    .execute(query)
    .then((result) => {
      if (result[0].length === 0)
        throw ApiError.NotFound('По заданным критериям ничего не найдено');

      if (result[0].length > 500)
        throw ApiError.BadRequest(
          'Обнаружено более 500 записей, уточните запрос'
        );

      return result[0];
    })
    .catch(function (err) { 
      next(err);
      return false;
    });

  if (transfers) res.json({ data: transfers });
}
