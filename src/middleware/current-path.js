/**
 * src/middleware/current-path.js — currentPath доступен во всех шаблонах
 * (включая include-парциалы) для подсветки навигации.
 */
module.exports = function currentPath(req, res, next) {
  res.locals.currentPath = req.path;
  next();
};
