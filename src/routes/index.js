/**
 * src/routes/index.js — агрегатор всех маршрутов приложения.
 */
const express = require('express');

const dashboardRoutes = require('./dashboard.routes');
const propertiesRoutes = require('./properties.routes');
const shipsRoutes = require('./ships.routes');
const entityRouteRegistry = require('./entity.routes'); // [{url, router}, ...]

const router = express.Router();

router.use('/', dashboardRoutes);
router.use('/properties', propertiesRoutes);
router.use('/ships', shipsRoutes);

// /equipment и /resources — генерируются одной фабрикой mountEntity
for (const { url, router: r } of entityRouteRegistry) {
  router.use(url, r);
}

module.exports = router;
