/**
 * server.js — точка входа. Запуск: npm install && npm start → http://localhost:3000
 * КРИТИЧНО для деплоя: порт из env и bind на 0.0.0.0.
 */
try { require('dotenv').config(); } catch (e) { /* dotenv опционален */ }

const app = require('./src/app');
const { dbPath } = require('./src/db/connection');

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`http://localhost:${PORT}`);
  console.log(`DB: ${dbPath}`);
});
