# Серверный запуск ГрантХаб

Приложение: https://83.222.24.233/ . Бот: https://max.ru/t511_hakaton_max_bot .
Для открытия внутри MAX владелец бота должен сохранить URL приложения в настройках MAX.
В обычном браузере приложение открывается напрямую и создаёт отдельную гостевую сессию с собственными профилем и избранным. Доступ к ней сохраняется, пока не очищено хранилище браузера. В MAX вход выполняется по подписанным данным платформы.

## Что запускается

- `api`: собранный React frontend и Express API, Node.js 22; SQLite в volume `grantshak_data`.
- `bot`: отдельный процесс long polling MAX. Использует приватный loopback API через общий сетевой namespace.
- Nginx на хосте: HTTPS, прокси в `127.0.0.1:4000`, закрытый снаружи `/api/internal/`.
- Сертификат Let's Encrypt для IP: короткий срок действия; systemd проверяет продление каждые 6 часов.
- Ежедневная согласованная резервная копия SQLite, хранение 14 дней в `/opt/grantshak-backups`.

Резервные копии на том же VPS защищают от ошибок приложения, но не от потери сервера. Для этого копируйте их на отдельное хранилище.

## Запуск Docker

Нужны Docker Engine и Docker Compose v2. Проект размещается в `/opt/grantshak`.

```sh
cp deploy/production.env.example .env.production
chmod 600 .env.production
```

Заполните `.env.production`: `MAX_BOT_TOKEN`, `MAX_BOT_USERNAME`, `ALLOWED_ORIGINS`, `JWT_SECRET` и `INTERNAL_API_KEY`. Для каждого из двух секретов сгенерируйте отдельное значение командой `openssl rand -hex 48`.

```sh
docker compose build
docker compose up -d
docker compose ps
curl http://127.0.0.1:4000/api/health
```

`ALLOW_DEV_AUTH=false` и `NODE_ENV=production` заданы в Compose. При новом адресе измените `ALLOWED_ORIGINS`. Секреты читаются из `.env.production`, не включаются в образы и Git.
Сборка скачивает официальный корневой сертификат MAX с Госуслуг и проверяет его SHA-256. Он подключается через `NODE_EXTRA_CA_CERTS` без отключения TLS-проверки.
На новую БД автоматически загружаются 34 программы из seed.

## HTTPS без домена

Для другого VPS замените IP в обоих Nginx-конфигах и командах ниже. Разрешите входящие TCP 80/443 и SSH в firewall провайдера/сервера. Порт 4000 опубликован только на loopback.

```sh
apt-get update
apt-get install -y docker.io docker-compose-v2 docker-buildx nginx
mkdir -p /var/www/letsencrypt
cp deploy/nginx-http.conf /etc/nginx/sites-available/default
nginx -t && systemctl reload nginx
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /var/log/letsencrypt:/var/log/letsencrypt \
  -v /var/www/letsencrypt:/var/www/letsencrypt \
  certbot/certbot:v5.4.0 certonly --non-interactive --agree-tos \
  --register-unsafely-without-email --preferred-profile shortlived \
  --webroot --webroot-path /var/www/letsencrypt --ip-address 83.222.24.233
cp deploy/nginx-https.conf /etc/nginx/sites-enabled/grantshak-https.conf
nginx -t && systemctl reload nginx
cp deploy/grantshak-*.service deploy/grantshak-*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now docker nginx grantshak-cert-renew.timer grantshak-backup.timer
sh deploy/renew-certificate.sh --dry-run --no-random-sleep-on-renew
systemctl start grantshak-backup.service
```

При установленном старом Certbot отключите его timer (`systemctl disable --now certbot.timer`): здесь сертификат обслуживает `grantshak-cert-renew.timer` с Certbot 5.4 в контейнере. Ошибки продления видны в `journalctl -u grantshak-cert-renew.service`; необходимо контролировать их, поскольку IP-сертификат действует около 6 дней.

## Обновление и диагностика

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 api bot
systemctl list-timers --all 'grantshak-*'
curl --fail https://83.222.24.233/api/health
```

Не запускайте одновременно локальный и серверный polling одного бота. Не выполняйте `docker compose down -v`: ключ `-v` удаляет базу. Перед изменениями данных выполните `systemctl start grantshak-backup.service`.

Для восстановления: остановите `bot` и `api`, сохраните текущий volume как отдельную копию, затем замените `grants.db` выбранной резервной копией, уберите только старые WAL/SHM этой БД и восстановите владельца UID 1000. После этого запустите Compose. Не заменяйте файл БД при работающем API.

## Проверка запуска

1. Открыть бота, отправить `/start`, нажать «Открыть ГрантХаб».
2. Проверить каталог, категории, поиск и карточку программы.
3. Сохранить профиль бизнеса и добавить программу в избранное.
4. Закрыть и заново открыть приложение: профиль и избранное должны сохраниться.
5. Другой MAX-пользователь должен иметь отдельный профиль и избранное.

Автоматические напоминания включаются через `NOTIFICATIONS_ENABLED=true`; после изменения настроек пересоздайте контейнеры командой `docker compose up -d`.

Технические проверки исходников: `npm run install:all`, `npm run check`, `npm test`, `npm run build` (Node.js >=22). Тесты используют отдельную БД в памяти и не отправляют сообщения в MAX.
