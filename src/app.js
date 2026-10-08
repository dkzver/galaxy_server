/**
 * src/app.js — сборка Express-приложения (без listen, удобно для тестов).
 */
const path = require('path');
const express = require('express');

const { initSchema } = require('./db/schema');
const currentPathMiddleware = require('./middleware/current-path');
const routes = require('./routes');

// БД создаётся автоматически при первом запуске
initSchema();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(currentPathMiddleware);

app.use(routes);

// 404
app.use((req, res) => res.status(404).send('Not found'));

module.exports = app;
