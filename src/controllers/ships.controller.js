/**
 * src/controllers/ships.controller.js — корабли: CRUD + свойства (EAV) + слоты.
 */
const { makeEntityRepository } = require('../repositories/entity.repository');
const slotRepo = require('../repositories/slot.repository');
const pvRepo = require('../repositories/property-value.repository');
const propsService = require('../services/props.service');

const shipRepo = makeEntityRepository('ships');
const ENTITY_TYPE = 'ship';

// GET /ships — список
function index(req, res) {
  const { db } = require('../db/connection');
  const ships = db
    .prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM ship_slots ss WHERE ss.ship_id = s.id) AS slot_count
      FROM ships s ORDER BY s.name
    `)
    .all();
  res.render('ships', {
    pageTitle: 'Корабли',
    rows: ships,
    url: '/ships',
    title: 'Корабли',
    extraCol: 'Слоты',
    flash: req.query.msg || null
  });
}

// POST /ships — создать
function create(req, res) {
  const info = shipRepo.create({
    name: (req.body.name || '').trim(),
    description: (req.body.description || '').trim()
  });
  res.redirect('/ships/' + info.lastInsertRowid);
}

// GET /ships/:id — редактирование (свойства + слоты)
function edit(req, res) {
  const ship = shipRepo.findById(req.params.id);
  if (!ship) return res.status(404).send('Ship not found');
  res.render('ship-edit', {
    pageTitle: ship.name,
    entity: ship,
    props: propsService.withDisplayValues(pvRepo.getEntityProperties(ENTITY_TYPE, ship.id)),
    slots: slotRepo.listByShip(ship.id),
    url: '/ships',
    flash: req.query.msg || null
  });
}

// POST /ships/:id — обновить (включая свойства)
function update(req, res) {
  shipRepo.update(req.params.id, {
    name: (req.body.name || '').trim(),
    description: (req.body.description || '').trim()
  });
  pvRepo.saveEntityProperties(
    ENTITY_TYPE,
    parseInt(req.params.id, 10),
    propsService.parsePropsFromBody(req.body)
  );
  res.redirect('/ships/' + req.params.id + '?msg=saved');
}

// POST /ships/:id/delete — удалить (+ очистить property_values и слоты)
function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  pvRepo.clearEntityProperties(ENTITY_TYPE, id);
  slotRepo.removeAllByShip(id);
  shipRepo.remove(id);
  res.redirect('/ships');
}

// ---------- Слоты ----------

// POST /ships/:id/slots — создать слот
function addSlot(req, res) {
  slotRepo.create(parseInt(req.params.id, 10), {
    name: (req.body.name || '').trim() || 'Slot',
    slot_type: (req.body.slot_type || '').trim(),
    position: parseInt(req.body.position || 0, 10)
  });
  res.redirect('/ships/' + req.params.id);
}

// POST /ships/:id/slots/:slotId — обновить слот
function updateSlot(req, res) {
  slotRepo.update(req.params.slotId, req.params.id, {
    name: (req.body.name || '').trim(),
    slot_type: (req.body.slot_type || '').trim(),
    position: parseInt(req.body.position || 0, 10)
  });
  res.redirect('/ships/' + req.params.id);
}

// POST /ships/:id/slots/:slotId/delete — удалить слот
function deleteSlot(req, res) {
  slotRepo.remove(req.params.slotId, req.params.id);
  res.redirect('/ships/' + req.params.id);
}

module.exports = { index, create, edit, update, remove, addSlot, updateSlot, deleteSlot };
