/**
 * src/routes/properties.routes.js — CRUD справочника свойств.
 */
const express = require('express');
const controller = require('../controllers/properties.controller');

const router = express.Router();

router.get('/', controller.index);
router.post('/', controller.create);
router.post('/:id', controller.update);
router.post('/:id/delete', controller.remove);

module.exports = router;
