# Интерфейс

Запуск из корня репозитория вместе с API:

```sh
npm run dev
```

Интерфейс доступен на http://127.0.0.1:5173. Запросы `/api` проксируются на http://127.0.0.1:4000.

Сборка и проверки из корня:

```sh
npm --prefix grants run build
npm --prefix grants run lint
npm --prefix grants test
```

Результат сборки: `grants/dist`. Общая инструкция: [README.md](../README.md).
