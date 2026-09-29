# MAX-бот

В корневом `.env` укажите `MAX_BOT_TOKEN`, `MAX_BOT_USERNAME`, `INTERNAL_API_KEY` и `API_BASE_URL`. Сначала запустите API, затем из корня репозитория выполните:

```sh
npm run bot
```

Для подключения к MAX перед запуском задайте `NODE_EXTRA_CA_CERTS` с путём к официальному корневому сертификату в формате PEM. В Docker сертификат подключается автоматически.

Команды бота: `/start`, `/app`, `/help`. Для одного токена должен работать один экземпляр long polling.

Проверки из корня:

```sh
npm --prefix my-bot run check
npm --prefix my-bot test
```

Настройка мини-приложения и запуск Docker: [README.md](../README.md).
