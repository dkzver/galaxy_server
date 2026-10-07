/**
 * server.js — Express 4 + EJS (server-side rendering), CommonJS.
 * Запуск: npm install && npm start → http://localhost:3000
 */
try { require('dotenv').config(); } catch (e) { /* dotenv опционален */ }

const path = require('path');
const express = require('express');
const { db, getEntityProperties, saveEntityProperties, clearEntityProperties } = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// currentPath доступен во всех шаблонах (включая include-парциалы) для подсветки навигации
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// ---------- Вспомогательные функции ----------

/** Разбор свойств из формы: prop[id]=value, prop_type[id]=type */
function parsePropsFromBody(body) {
  const out = [];
  const raw = body.prop || {};
  const types = body.prop_type || {};
  for (const pid of Object.keys(raw)) {
    out.push({
      property_id: parseInt(pid, 10),
      value: raw[pid],
      type: types[pid] || 'string'
    });
  }
  return out;
}

/** Значение свойства для отображения в форме */
function displayVal(p) {
  if (p.value == null) return '';
  return String(p.value);
}

// ---------- Дашборд ----------
app.get('/', (req, res) => {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  res.render('index', {
    counts: {
      properties: count('properties'),
      ships: count('ships'),
      equipment: count('equipment'),
      resources: count('resources'),
      slots: count('ship_slots')
    }
  });
});

// ---------- Свойства ----------
app.get('/properties', (req, res) => {
  const props = db.prepare('SELECT * FROM properties ORDER BY name').all();
  res.render('properties', { props, edit: null, error: null });
});

app.post('/properties', (req, res) => {
  const { name, type, unit } = req.body;
  if (!name || !['string', 'number', 'boolean'].includes(type)) {
    return res.status(400).render('properties', {
      props: db.prepare('SELECT * FROM properties ORDER BY name').all(),
      edit: req.body,
      error: 'Укажите название и корректный тип (string / number / boolean).'
    });
  }
  try {
    db.prepare('INSERT INTO properties (name, type, unit) VALUES (?, ?, ?)')
      .run(name.trim(), type, (unit || '').trim());
  } catch (e) {
    return res.status(400).render('properties', {
      props: db.prepare('SELECT * FROM properties ORDER BY name').all(),
      edit: req.body,
      error: 'Свойство с таким названием уже существует.'
    });
  }
  res.redirect('/properties');
});

app.post('/properties/:id', (req, res) => {
  const { name, type, unit } = req.body;
  try {
    db.prepare('UPDATE properties SET name = ?, type = ?, unit = ? WHERE id = ?')
      .run((name || '').trim(), type, (unit || '').trim(), req.params.id);
  } catch (e) {
    return res.redirect('/properties');
  }
  res.redirect('/properties');
});

app.post('/properties/:id/delete', (req, res) => {
  // ON DELETE CASCADE в property_values подчистит значения
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.redirect('/properties');
});

// ---------- Корабли (сущность + слоты + свойства) ----------
app.get('/ships', (req, res) => {
  const ships = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM ship_slots ss WHERE ss.ship_id = s.id) AS slot_count
    FROM ships s ORDER BY s.name
  `).all();
  res.render('ships', { rows: ships, flash: req.query.msg || null });
});

app.post('/ships', (req, res) => {
  const info = db.prepare('INSERT INTO ships (name, description) VALUES (?, ?)')
    .run((req.body.name || '').trim(), (req.body.description || '').trim());
  res.redirect('/ships/' + info.lastInsertRowid);
});

// ---------- Страница редактирования корабля (свойства + слоты) ----------
app.get('/ships/:id', (req, res) => {
  const ship = db.prepare('SELECT * FROM ships WHERE id = ?').get(req.params.id);
  if (!ship) return res.status(404).send('Ship not found');
  const props = getEntityProperties('ship', ship.id).map(displayValize);
  const slots = db.prepare('SELECT * FROM ship_slots WHERE ship_id = ? ORDER BY position, id')
    .all(ship.id);
  res.render('ship-edit', { entity: ship, props, slots, flash: req.query.msg || null });
});

function displayValize(p) {
  p.val = displayVal(p);
  return p;
}

app.post('/ships/:id', (req, res) => {
  db.prepare('UPDATE ships SET name = ?, description = ? WHERE id = ?')
    .run((req.body.name || '').trim(), (req.body.description || '').trim(), req.params.id);
  saveEntityProperties('ship', parseInt(req.params.id, 10), parsePropsFromBody(req.body));
  res.redirect('/ships/' + req.params.id + '?msg=saved');
});

app.post('/ships/:id/delete', (req, res) => {
  const id = parseInt(req.params.id, 10);
  clearEntityProperties('ship', id);            // значения свойств
  db.prepare('DELETE FROM ship_slots WHERE ship_id = ?').run(id); // слоты
  db.prepare('DELETE FROM ships WHERE id = ?').run(id);
  res.redirect('/ships');
});

// ---------- Слоты корабля ----------
app.post('/ships/:id/slots', (req, res) => {
  db.prepare('INSERT INTO ship_slots (ship_id, name, slot_type, position) VALUES (?, ?, ?, ?)')
    .run(parseInt(req.params.id, 10), (req.body.name || '').trim() || 'Slot',
         (req.body.slot_type || '').trim(), parseInt(req.body.position || 0, 10));
  res.redirect('/ships/' + req.params.id);
});

app.post('/ships/:id/slots/:slotId', (req, res) => {
  db.prepare('UPDATE ship_slots SET name = ?, slot_type = ?, position = ? WHERE id = ? AND ship_id = ?')
    .run((req.body.name || '').trim(), (req.body.slot_type || '').trim(),
         parseInt(req.body.position || 0, 10), req.params.slotId, req.params.id);
  res.redirect('/ships/' + req.params.id);
});

app.post('/ships/:id/slots/:slotId/delete', (req, res) => {
  db.prepare('DELETE FROM ship_slots WHERE id = ? AND ship_id = ?')
    .run(req.params.slotId, req.params.id);
  res.redirect('/ships/' + req.params.id);
});

// ---------- Фабрика CRUD для Equipment / Resources ----------
function mountEntity({ url, table, entityType, title }) {
  // Список
  app.get(url, (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY name`).all();
    res.render('entity-list', {
      rows, url, title, extraCol: null, flash: req.query.msg || null
    });
  });

  // Создать
  app.post(url, (req, res) => {
    const info = db.prepare(`INSERT INTO ${table} (name, description) VALUES (?, ?)`)
      .run((req.body.name || '').trim(), (req.body.description || '').trim());
    res.redirect(`${url}/${info.lastInsertRowid}`);
  });

  // Форма редактирования
  app.get(`${url}/:id`, (req, res) => {
    const entity = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!entity) return res.status(404).send('Not found');
    const props = getEntityProperties(entityType, entity.id).map(displayValize);
    res.render('entity-edit', {
      entity, props, url, title, entityType, flash: req.query.msg || null
    });
  });

  // Обновить (включая свойства)
  app.post(`${url}/:id`, (req, res) => {
    db.prepare(`UPDATE ${table} SET name = ?, description = ? WHERE id = ?`)
      .run((req.body.name || '').trim(), (req.body.description || '').trim(), req.params.id);
    saveEntityProperties(entityType, parseInt(req.params.id, 10), parsePropsFromBody(req.body));
    res.redirect(`${url}/${req.params.id}?msg=saved`);
  });

  // Удалить (+ очистить property_values)
  app.post(`${url}/:id/delete`, (req, res) => {
    const id = parseInt(req.params.id, 10);
    clearEntityProperties(entityType, id);
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    res.redirect(url);
  });
}

mountEntity({ url: '/equipment', table: 'equipment', entityType: 'equipment', title: 'Оборудование' });
mountEntity({ url: '/resources', table: 'resources', entityType: 'resource', title: 'Ресурсы' });

// ---------- 404 ----------
app.use((req, res) => res.status(404).send('Not found'));

// КРИТИЧНО для деплоя: порт из env и bind на 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`http://localhost:${PORT}`));
