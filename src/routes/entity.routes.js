/**
 * src/routes/entity.routes.js — фабрика маршрутов mountEntity({...}).
 * Генерирует полный набор CRUD-маршрутов для /equipment и /resources:
 *   GET    url            — список
 *   POST   url            — создать
 *   GET    url/:id        — редактирование (свойства)
 *   POST   url/:id        — обновить (включая свойства)
 *   POST   url/:id/delete — удалить (+ очистить property_values)
 */
const express = require('express');
const { makeEntityController } = require('../controllers/entity.controller');

function mountEntity({ url, table, entityType, title }) {
  const controller = makeEntityController({ table, entityType, title });
  const router = express.Router();

  router.get('/', controller.index);
  router.post('/', controller.create);
  router.get('/:id', controller.edit);
  router.post('/:id', controller.update);
  router.post('/:id/delete', controller.remove);

  return { router, url };
}

const registry = [
  mountEntity({ url: '/equipment', table: 'equipment', entityType: 'equipment', title: 'Оборудование' }),
  mountEntity({ url: '/resources', table: 'resources', entityType: 'resource', title: 'Ресурсы' })
];

module.exports = registry;
