import 'dotenv/config'
import { logger } from './utils/logger'
import { createServer } from './utils/server'
import connect from './utils/dbConfig'

connect() // db connection
const app = createServer()
const PORT = 3000

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`Server started on port ${PORT}`)
    })
}

export default app
