/**
 * db.js — инициализация SQLite (better-sqlite3), схема и сид данных.
 * БД создаётся автоматически при первом запуске.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Путь к БД: из env (для хостинга с persistent disk) или ./data.db в корне проекта
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');

// Убедимся, что папка для файла БД существует (не падать при DB_PATH в подпапке)
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT NOT NULL UNIQUE,
    type   TEXT NOT NULL CHECK (type IN ('string','number','boolean')),
    unit   TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS ships (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS resources (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS ship_slots (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ship_id   INTEGER NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    slot_type TEXT DEFAULT '',
    position  INTEGER DEFAULT 0
  );

  -- EAV: значения свойств для кораблей / оборудования / ресурсов
  CREATE TABLE IF NOT EXISTS property_values (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('ship','equipment','resource')),
    entity_id   INTEGER NOT NULL,
    value       TEXT DEFAULT '',
    UNIQUE (property_id, entity_type, entity_id)
  );
`);

// ---------- Помощники для EAV ----------

/** Все свойства + значение для конкретной сущности */
function getEntityProperties(entityType, entityId) {
  return db.prepare(`
    SELECT p.id, p.name, p.type, p.unit, pv.value
    FROM properties p
    LEFT JOIN property_values pv
      ON pv.property_id = p.id AND pv.entity_type = ? AND pv.entity_id = ?
    ORDER BY p.name
  `).all(entityType, entityId);
}

/** Сохранение значений свойств (вставка/обновление по UNIQUE-ключу) */
const upsertValue = db.prepare(`
  INSERT INTO property_values (property_id, entity_type, entity_id, value)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (property_id, entity_type, entity_id)
  DO UPDATE SET value = excluded.value
`);

function saveEntityProperties(entityType, entityId, props) {
  const tx = db.transaction((items) => {
    for (const item of items) {
      if (!item.property_id) continue;
      let value = item.value == null ? '' : String(item.value);
      // нормализуем boolean
      if (item.type === 'boolean') value = value === 'true' ? 'true' : value === 'false' ? 'false' : '';
      upsertValue.run(item.property_id, entityType, entityId, value);
    }
  });
  tx(props || []);
}

/** Очистка значений свойств при удалении сущности */
function clearEntityProperties(entityType, entityId) {
  db.prepare('DELETE FROM property_values WHERE entity_type = ? AND entity_id = ?')
    .run(entityType, entityId);
}

// ---------- Сид: наполним справочник свойств при первом запуске ----------
const propCount = db.prepare('SELECT COUNT(*) AS c FROM properties').get().c;
if (propCount === 0) {
  const seed = db.prepare('INSERT INTO properties (name, type, unit) VALUES (?, ?, ?)');
  [
    ['Speed', 'number', 'm/s'],
    ['Armor', 'number', 'pts'],
    ['Cargo capacity', 'number', 't'],
    ['Shield generator', 'boolean', ''],
    ['Class', 'string', '']
  ].forEach((row) => seed.run(row[0], row[1], row[2]));
}

module.exports = { db, getEntityProperties, saveEntityProperties, clearEntityProperties };
