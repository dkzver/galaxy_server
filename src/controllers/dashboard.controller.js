/**
 * src/controllers/dashboard.controller.js — дашборд со счётчиками.
 */
const { db } = require('../db/connection');

function index(req, res) {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  res.render('index', {
    pageTitle: 'Главная',
    counts: {
      properties: count('properties'),
      ships: count('ships'),
      equipment: count('equipment'),
      resources: count('resources'),
      slots: count('ship_slots')
    }
  });
}

module.exports = { index };
