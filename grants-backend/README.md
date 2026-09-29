# API

Запуск из корня репозитория:

```sh
npm run setup
npm run install:all
npm --prefix grants-backend run dev
```

Проверка доступности: http://127.0.0.1:4000/api/health.

Для запуска собранного сайта и API:

```sh
npm run build
npm start
```

Настройки читаются из корневого `.env`. По умолчанию SQLite хранится в `grants-backend/data/grants.db`. При первом запуске каталог заполняется из `data/grants.seed.json`.

Проверки из корня:

```sh
npm --prefix grants-backend run check
npm --prefix grants-backend test
```

Общая инструкция и запуск Docker: [README.md](../README.md).
