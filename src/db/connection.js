/**
 * src/db/connection.js — соединение с SQLite (better-sqlite3).
 * Путь к БД: DB_PATH из env (для хостинга с persistent disk) или ./data.db в корне проекта.
 * Папка для файла БД создаётся автоматически (не падаем при DB_PATH в подпапке).
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT_DIR = path.join(__dirname, '..', '..'); // корень проекта
const dbPath = process.env.DB_PATH || path.join(ROOT_DIR, 'data.db');

fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = { db, dbPath };
