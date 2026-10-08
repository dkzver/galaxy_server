/**
 * src/db/schema.js — схема БД + сид справочника свойств при первом запуске.
 */
const { db } = require('./connection');

function initSchema() {
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

  // Сид: наполним справочник свойств при первом запуске
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
}

module.exports = { initSchema };
