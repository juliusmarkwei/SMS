import mongoose from 'mongoose'
import 'dotenv/config'
import { logger } from './logger'

const connect = async () => {
    const connection = mongoose.connection.readyState
    if (connection === 1) {
        logger.info('Already connected to database')
        return
    }
    if (connection === 2) {
        logger.info('Connecting to database')
        return
    }

    try {
        mongoose.connect(process.env.MONGODB_URI as string, {
            bufferCommands: true,
        })

        mongoose.connection.on('connected', () => {
            logger.info('Connected to database')
        })
    } catch (error: any) {
        logger.error('Error connecting to database: ', error.message)
    }
}

export const connectTestDB = async () => {
    if (mongoose.connection.readyState === 1) {
        logger.info('Already connected to test database')
        return
    }
    if (mongoose.connection.readyState === 2) {
        logger.info('Connecting to test database')
        return
    }
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/smsTest`, {
            bufferCommands: true,
        })

        mongoose.connection.on('connected', () => {
            logger.info('Connected to test database')
        })
    } catch (error: any) {
        logger.error('Error connecting to test database: ', error.message)
    }
}

export default connect
