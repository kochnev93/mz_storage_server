import pool from '../../db/db.js';
import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';

export async function addProduct(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const { name, comment, unit, category, property, snAccounting } = req.body;
  console.log(property, !!property.length);

  const token = req.headers.authorization.split(' ')[1];
  const decode = jwt_decode(token);
  const id_author = decode.id;

  const getSelectedProperty = (arr) => {
    const result = [];

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[i].value.length; j++) {
        if (arr[i].value[j].isCheked) {
          result.push({
            id_property: arr[i].id_property,
            property: arr[i].property,
            id: arr[i].value[j].id,
            value: arr[i].value[j].title,
          });
        }
      }
    }

    const lastProduct = `(SELECT id FROM mz_nomenclature WHERE name='${name}' ORDER BY id DESC LIMIT 1)`;

    const resultStr = result.map((item) => {
      return `(${lastProduct},  ${item.id})`;
    });

    return resultStr.join();
  };

  const queryAddProduct = `
  INSERT INTO mz_nomenclature 
  (id_category, name, id_unit, comment, accounting_sn, date_create, author ) 
  VALUES ('${category.id}', '${name}', '${unit.id}', '${comment}', '${
    snAccounting ? '1' : '0'
  }', ( SELECT NOW() ), '${id_author}')`;

  const queryAddPropertyProduct = `
  INSERT INTO mz_product_characteristic 
  (id_product, id_property_value) 
  VALUES 
  ${getSelectedProperty(property)}`;

  pool
    .execute(queryAddProduct)
    .then((result) => {
      res.json({ message: 'Товар добавлен' });
      return property.length ? pool.execute(queryAddPropertyProduct) : undefined;
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: err.message });
    });
}
