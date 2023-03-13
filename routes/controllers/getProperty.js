import pool from '../../db/db.js';

export async function getProperty(req, res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE,GET,PATCH,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  const category_id = req.params.category_id;


  const query = `
  SELECT mz_p.id_property, mz_p.property, mz_pv.id, mz_pv.value
  FROM mz_property mz_p
  JOIN mz_property_value mz_pv ON mz_p.id_property = mz_pv.id_property
  WHERE mz_p.id_category = ${category_id}
  ORDER BY mz_p.id_property
  `;

  const prepareArray = (arr) => {
    const result = [];

    for (let i = 0; i < arr.length; i++){
      let index = result.findIndex(item => item?.id_property === arr[i].id_property);
      if(index !== -1){
        result[index].value.push({
          id: arr[i].id,
          title: arr[i].value,
          isCheked: false,
        })
      } else{
        result.push({
          id_property: arr[i].id_property, 
          property: arr[i].property, 
          value: [{
              id: arr[i].id,
              title: arr[i].value,
              isCheked: false,
            }]
        })
      }
    }

    console.log('ResultArray: ', result);

    return result;

  }

   pool
     .execute(query)
     .then((result) => {
       const data = prepareArray(result[0]);
       res.json({data: data});

     })
     .catch(function (err) {
       console.log(err);
     });
} 
