# API ГрантХаб

Полная инструкция запуска находится в [корневом README](../README.md).

Конфигурация: корневой `.env`, одна для API и бота. Данные: `data/grants.db`, первичное заполнение только из серверного `data/grants.seed.json`. Обычный запуск не перезаписывает каталог.

`src/app.ts` собирает HTTP-приложение без запуска сервера и cron; его используют интеграционные тесты. `src/server.ts` отвечает только за запуск и остановку процесса. `routes` содержит обработчики HTTP, `middleware` — проверки доступа, `services` — уведомления. `db.ts` владеет SQLite и схемой, `seed.ts` — первоначальным наполнением, `max.ts` — интеграцией с MAX.

| Метод | URL | Доступ |
|---|---|---|
| GET | /api/health, /api/config | публично; без секретов |
| POST | /api/auth/max | подписанные initData MAX, срок до 1 часа |
| POST | /api/auth/dev | только явно включённый локальный режим |
| GET | /api/grants, /api/grants/:id | публично, из БД |
| GET | /api/favorites | JWT, только свой пользователь |
| POST/DELETE | /api/favorites/:grantId | JWT |
| GET/PUT | /api/profile | JWT |
| POST | /api/internal/bot/start | x-internal-key, регистрация/остановка диалога |
| POST | /api/internal/notify-check | x-internal-key, только при включённых уведомлениях |

Формат профиля API: `{ name, categoryId, stage, employees, annualRevenue, legalForm }`, все значения — строки. Внутри SQLite используются snake_case колонки; преобразование выполняет сервер.

`npm run build` компилирует сервер. `npm start` отдаёт API и собранный `../grants/dist`. `npm test` проверяет подпись MAX, изоляцию пользователей, избранное, профиль, локальный вход, безопасность внутренних маршрутов и сохранность существующей БД при старте. Тесты не отправляют сообщений.
