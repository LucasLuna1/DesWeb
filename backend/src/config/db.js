const mysql = require('mysql2');

// Crear conexión a la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'medical_appointments',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertir a promesas para usar async/await
const promisePool = pool.promise();

module.exports = promisePool; 