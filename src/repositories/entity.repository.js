/**
 * src/repositories/entity.repository.js — обобщённый репозиторий для таблиц
 * с колонками (id, name, description): ships / equipment / resources.
 * Имя таблицы приходит из конфига фабрики (жёстко заданный, не из запроса пользователя).
 */
const { db } = require('../db/connection');

function makeEntityRepository(table) {
  return {
    table,

    listAll() {
      return db.prepare(`SELECT * FROM ${table} ORDER BY name`).all();
    },

    findById(id) {
      return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    },

    create({ name, description }) {
      return db
        .prepare(`INSERT INTO ${table} (name, description) VALUES (?, ?)`)
        .run(name, description);
    },

    update(id, { name, description }) {
      return db
        .prepare(`UPDATE ${table} SET name = ?, description = ? WHERE id = ?`)
        .run(name, description, id);
    },

    remove(id) {
      return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }
  };
}

module.exports = { makeEntityRepository };
