/**
 * src/db/connection.js — соединение с SQLite (node:sqlite).
 * Путь к БД: DB_PATH из env (для хостинга с persistent disk) или ./data.db в корне проекта.
 * Папка для файла БД создаётся автоматически (не падаем при DB_PATH в подпапке).
 */
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT_DIR = path.join(__dirname, '..', '..'); // корень проекта
const dbPath = process.env.DB_PATH || path.join(ROOT_DIR, 'data.db');

fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

module.exports = { db, dbPath };
