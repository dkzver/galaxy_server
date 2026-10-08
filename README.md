# 🚀 Space Admin

Веб-админка для управления сущностями космической игры: **свойства (EAV), корабли (+слоты), оборудование, ресурсы**.

## Стек
- Node.js 22.13+ + Express 4
- EJS (server-side rendering, без React/Vue и сборщиков)
- SQLite через встроенный модуль `node:sqlite` (без ORM)
- CommonJS, тёмная тема, один файл CSS

## Локальный запуск
```bash
npm install
npm start        # → http://localhost:3000
```
Требуется Node.js 22.13 или новее.
БД `data.db` создаётся автоматически при первом запуске (со справочником свойств-примеров).
Для разработки: `npm run dev` (авто-перезапуск через `node --watch`).

Переменные окружения (см. `.env.example`):
```
PORT=3000
DB_PATH=./data.db
```

## Структура
```
space-admin/
├─ package.json
├─ server.js          # маршруты + фабрика mountEntity для /equipment и /resources
├─ db.js              # схема SQLite, EAV-помощники, сид
├─ .gitignore
├─ .env.example
├─ Procfile           # web: npm start (Railway / Render / Heroku)
├─ public/style.css   # тёмная тема
└─ views/
   ├─ partials/header.ejs, footer.ejs, entity-props.ejs
   ├─ index.ejs          # дашборд со счётчиками
   ├─ properties.ejs     # строки таблицы редактируются inline (form="f-<id>")
   ├─ ships.ejs          # список кораблей (inline-редактирование)
   ├─ ship-edit.ejs      # корабль: свойства + слоты
   ├─ entity-list.ejs    # универсальный список (equipment/resources)
   └─ entity-edit.ejs    # универсальное редактирование (equipment/resources)
```

---

## Публикация по URL

### Вариант A — Railway (рекомендуется, persistent disk для SQLite)
1. **Push проекта на GitHub** (`git init && git add -A && git commit -m "init" && git push`).
2. Зайдите на [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → выберите репозиторий.
3. Railway автоматически определит Node.js и выполнит `npm install && npm start` (берёт команду из `Procfile`/`package.json`). Приложение слушает `process.env.PORT` и bind на `0.0.0.0` — ничего настраивать не нужно.
4. **Settings → Volumes → New Volume**, смонтируйте persistent volume в `/app/data`. Затем **Settings → Variables → New Variable**: `DB_PATH=/app/data/data.db` — база переживёт перезапуски и деплои.
5. **Settings → Networking → Generate Domain** → получите публичный URL вида `https://space-admin-xxx.up.railway.app` (HTTPS из коробки).

### Вариант B — Render (free tier, но засыпает через 15 минут)
1. Push на GitHub → [render.com](https://render.com) → **New → Web Service**.
2. Build Command: `npm install`, Start Command: `npm start`.
3. Environment: добавить переменную `DB_PATH=/var/data/data.db`.
4. **Disks → Add Disk**: путь `/var/data`, размер 1 GB (бесплатно) — иначе БД сотрётся при редиплое.
5. Получить URL вида `https://space-admin.onrender.com`.

> ⚠️ Free tier Render **усыпляет** приложение после 15 минут неактивности: первый запрос после простоя выполняется ~30 секунд (spin-up). Для админки это обычно приемлемо.

### Вариант C — Fly.io (Docker, 3 бесплатные VM)
1. Установите `flyctl`, выполните `fly auth signup`.
2. В корне проекта: `fly launch` (создаст `fly.toml` и Dockerfile; отклоните предложение Postgres — у нас SQLite).
3. В `fly.toml` добавьте монтирование диска:
   ```toml
   [mounts]
     source = "data"
     destination = "/data"
   ```
   и переменную `DB_PATH="/data/data.db"` в секцию `[env]`.
4. `fly deploy` → URL вида `https://<app>.fly.dev`.

### ⛔ Важно: Vercel и Netlify НЕ подходят
Эти платформы **serverless**: они не запускают постоянный процесс Node/Express и не дают реальной файловой системы с persistent disk. Наш проект — это долгоживущий процесс + SQLite-файл на диске, поэтому деплоить можно только на платформы с постоянной VM/контейнером (Railway, Render, Fly.io, Heroku, VPS).

## Безопасность
Проект сделан по ТЗ **без авторизации** — не публикуйте его в интернет, если данные чувствительны, либо поставьте перед ним Basic Auth / VPN / защиту на уровне платформы.
