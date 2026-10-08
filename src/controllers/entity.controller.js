/**
 * src/controllers/entity.controller.js — фабрика контроллеров CRUD
 * для сущностей вида (id, name, description) + свойства EAV.
 * Используется для /equipment и /resources.
 */
const { makeEntityRepository } = require('../repositories/entity.repository');
const pvRepo = require('../repositories/property-value.repository');
const propsService = require('../services/props.service');

/**
 * @param {{table: string, entityType: string, title: string}} config
 * @returns контроллеры { index, create, edit, update, remove }
 */
function makeEntityController({ table, entityType, title }) {
  const repo = makeEntityRepository(table);

  return {
    // GET url — список
    index(req, res) {
      res.render('entity-list', {
        pageTitle: title,
        rows: repo.listAll(),
        url: '/' + table, // относительный путь совпадает с именем таблицы
        title,
        extraCol: null,
        flash: req.query.msg || null
      });
    },

    // POST url — создать
    create(req, res) {
      const info = repo.create({
        name: (req.body.name || '').trim(),
        description: (req.body.description || '').trim()
      });
      res.redirect(`/${table}/${info.lastInsertRowid}`);
    },

    // GET url/:id — форма редактирования
    edit(req, res) {
      const entity = repo.findById(req.params.id);
      if (!entity) return res.status(404).send('Not found');
      res.render('entity-edit', {
        pageTitle: entity.name,
        entity,
        props: propsService.withDisplayValues(pvRepo.getEntityProperties(entityType, entity.id)),
        url: '/' + table,
        title,
        entityType,
        flash: req.query.msg || null
      });
    },

    // POST url/:id — обновить (включая свойства)
    update(req, res) {
      repo.update(req.params.id, {
        name: (req.body.name || '').trim(),
        description: (req.body.description || '').trim()
      });
      pvRepo.saveEntityProperties(
        entityType,
        parseInt(req.params.id, 10),
        propsService.parsePropsFromBody(req.body)
      );
      res.redirect(`/${table}/${req.params.id}?msg=saved`);
    },

    // POST url/:id/delete — удалить (+ очистить property_values)
    remove(req, res) {
      const id = parseInt(req.params.id, 10);
      pvRepo.clearEntityProperties(entityType, id);
      repo.remove(id);
      res.redirect('/' + table);
    }
  };
}

module.exports = { makeEntityController };
