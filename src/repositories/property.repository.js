/**
 * src/repositories/property.repository.js — данные для таблицы свойств.
 */
const { db } = require('../db/connection');

function listAll() {
  return db.prepare('SELECT * FROM properties ORDER BY name').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
}

function create({ name, type, unit }) {
  return db
    .prepare('INSERT INTO properties (name, type, unit) VALUES (?, ?, ?)')
    .run(name, type, unit);
}

function update(id, { name, type, unit }) {
  return db
    .prepare('UPDATE properties SET name = ?, type = ?, unit = ? WHERE id = ?')
    .run(name, type, unit, id);
}

function remove(id) {
  // ON DELETE CASCADE в property_values подчистит значения
  return db.prepare('DELETE FROM properties WHERE id = ?').run(id);
}

module.exports = { listAll, findById, create, update, remove };
