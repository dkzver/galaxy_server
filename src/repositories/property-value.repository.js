/**
 * src/repositories/property-value.repository.js — EAV: значения свойств сущностей.
 */
const { db } = require('../db/connection');

/** Все свойства + значение для конкретной сущности */
function getEntityProperties(entityType, entityId) {
  return db
    .prepare(`
      SELECT p.id, p.name, p.type, p.unit, pv.value
      FROM properties p
      LEFT JOIN property_values pv
        ON pv.property_id = p.id AND pv.entity_type = ? AND pv.entity_id = ?
      ORDER BY p.name
    `)
    .all(entityType, entityId);
}

// prepare выполняется лениво — после того, как src/db/schema.js создаст таблицы
let upsertValue = null;
function getUpsert() {
  if (!upsertValue) {
    upsertValue = db.prepare(`
      INSERT INTO property_values (property_id, entity_type, entity_id, value)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (property_id, entity_type, entity_id)
      DO UPDATE SET value = excluded.value
    `);
  }
  return upsertValue;
}

/** Сохранение значений свойств (вставка/обновление по UNIQUE-ключу) */
function saveEntityProperties(entityType, entityId, props) {
  db.exec('BEGIN');
  try {
    for (const item of props || []) {
      if (!item.property_id) continue;
      let value = item.value == null ? '' : String(item.value);
      // нормализуем boolean
      if (item.type === 'boolean') {
        value = value === 'true' ? 'true' : value === 'false' ? 'false' : '';
      }
      getUpsert().run(item.property_id, entityType, entityId, value);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/** Очистка значений свойств при удалении сущности */
function clearEntityProperties(entityType, entityId) {
  db.prepare('DELETE FROM property_values WHERE entity_type = ? AND entity_id = ?')
    .run(entityType, entityId);
}

module.exports = { getEntityProperties, saveEntityProperties, clearEntityProperties };
