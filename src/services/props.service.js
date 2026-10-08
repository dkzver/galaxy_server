/**
 * src/services/props.service.js — разбор формы свойств и подготовка значений для шаблонов.
 */

/** Разбор свойств из формы: prop[id]=value, prop_type[id]=type */
function parsePropsFromBody(body) {
  const out = [];
  const raw = (body && body.prop) || {};
  const types = (body && body.prop_type) || {};
  for (const pid of Object.keys(raw)) {
    out.push({
      property_id: parseInt(pid, 10),
      value: raw[pid],
      type: types[pid] || 'string'
    });
  }
  return out;
}

/** Добавить поле val (строковое значение) для отображения в форме */
function withDisplayValues(props) {
  return props.map((p) => ({ ...p, val: p.value == null ? '' : String(p.value) }));
}

module.exports = { parsePropsFromBody, withDisplayValues };
