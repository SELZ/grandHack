import 'dotenv/config'
import { seedGrants } from '../seed.js'
import { checkExpiringGrantsAndNotify } from '../services/notifications.js'

seedGrants(true)

checkExpiringGrantsAndNotify()
  .then((result) => {
    console.log('Notify check result:', result)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Notify check failed:', err)
    process.exit(1)
  })
