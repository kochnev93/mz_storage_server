import mysql from 'mysql2';
import { dbConfig } from './db.config.js';

const pool = mysql.createPool(dbConfig).promise();

// pool.connect((err) => {
//   if (err) throw error;
//   console.log(`Соединение с БД: ${dbConfig.database} успешно установлено...`);
// });

export default pool;


