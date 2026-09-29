import { createApp } from './app.js'
import { config } from './config.js'
import { db } from './db.js'
import { startNotificationCron } from './services/notifications.js'

const app = createApp()
const server = app.listen(config.port, config.host, () => console.log(`[server] http://${config.host}:${config.port}`))
const cron = config.notifications ? startNotificationCron() : undefined
const shutdown = () => { cron?.stop(); server.close(() => { db.close(); process.exit(0) }) }
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
