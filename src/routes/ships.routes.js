/**
 * src/routes/ships.routes.js — корабли + слоты.
 */
const express = require('express');
const controller = require('../controllers/ships.controller');

const router = express.Router();

router.get('/', controller.index);
router.post('/', controller.create);
router.get('/:id', controller.edit);
router.post('/:id', controller.update);
router.post('/:id/delete', controller.remove);

// Слоты корабля
router.post('/:id/slots', controller.addSlot);
router.post('/:id/slots/:slotId', controller.updateSlot);
router.post('/:id/slots/:slotId/delete', controller.deleteSlot);

module.exports = router;
