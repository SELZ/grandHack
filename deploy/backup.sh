#!/bin/sh
set -eu
umask 077
cd /opt/grantshak
mkdir -p /opt/grantshak-backups
chmod 700 /opt/grantshak-backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
destination="/opt/grantshak-backups/grants-$stamp.db"
docker compose exec -T api node --input-type=module -e '
import Database from "/app/grants-backend/node_modules/better-sqlite3/lib/index.js";
const db = new Database("/app/storage/grants.db", {readonly:true});
await db.backup("/app/storage/backup.db");
db.close();
'
docker compose cp api:/app/storage/backup.db "$destination"
chmod 600 "$destination"
find /opt/grantshak-backups -type f -name 'grants-*.db' -mtime +14 -delete
