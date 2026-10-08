/**
 * src/repositories/slot.repository.js — слоты корабля (ship_slots).
 */
const { db } = require('../db/connection');

function listByShip(shipId) {
  return db
    .prepare('SELECT * FROM ship_slots WHERE ship_id = ? ORDER BY position, id')
    .all(shipId);
}

function create(shipId, { name, slot_type, position }) {
  return db
    .prepare('INSERT INTO ship_slots (ship_id, name, slot_type, position) VALUES (?, ?, ?, ?)')
    .run(shipId, name, slot_type, position);
}

function update(slotId, shipId, { name, slot_type, position }) {
  return db
    .prepare('UPDATE ship_slots SET name = ?, slot_type = ?, position = ? WHERE id = ? AND ship_id = ?')
    .run(name, slot_type, position, slotId, shipId);
}

function remove(slotId, shipId) {
  return db.prepare('DELETE FROM ship_slots WHERE id = ? AND ship_id = ?').run(slotId, shipId);
}

function removeAllByShip(shipId) {
  return db.prepare('DELETE FROM ship_slots WHERE ship_id = ?').run(shipId);
}

module.exports = { listByShip, create, update, remove, removeAllByShip };
