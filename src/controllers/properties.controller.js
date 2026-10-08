/**
 * src/controllers/properties.controller.js — CRUD справочника свойств.
 */
const propertyRepo = require('../repositories/property.repository');

const VALID_TYPES = ['string', 'number', 'boolean'];

function renderList(res, { edit = null, error = null, status = 200 }) {
  res.status(status).render('properties', {
    pageTitle: 'Свойства',
    props: propertyRepo.listAll(),
    edit,
    error
  });
}

// GET /properties — список + форма
function index(req, res) {
  renderList(res, {});
}

// POST /properties — создать
function create(req, res) {
  const { name, type, unit } = req.body;
  if (!name || !VALID_TYPES.includes(type)) {
    return renderList(res, {
      edit: req.body,
      error: 'Укажите название и корректный тип (string / number / boolean).',
      status: 400
    });
  }
  try {
    propertyRepo.create({ name: name.trim(), type, unit: (unit || '').trim() });
  } catch (e) {
    return renderList(res, {
      edit: req.body,
      error: 'Свойство с таким названием уже существует.',
      status: 400
    });
  }
  res.redirect('/properties');
}

// POST /properties/:id — обновить
function update(req, res) {
  const { name, type, unit } = req.body;
  try {
    propertyRepo.update(req.params.id, {
      name: (name || '').trim(),
      type,
      unit: (unit || '').trim()
    });
  } catch (e) {
    return res.redirect('/properties');
  }
  res.redirect('/properties');
}

// POST /properties/:id/delete — удалить
function remove(req, res) {
  propertyRepo.remove(req.params.id);
  res.redirect('/properties');
}

module.exports = { index, create, update, remove };
