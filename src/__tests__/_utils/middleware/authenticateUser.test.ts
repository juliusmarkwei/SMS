module.exports = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
}
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import app from '../../../script'
import { generateTestToken } from '../../../test_data/user.data'
import mongoose from 'mongoose'
import { client } from '../../../utils/cache'

jest.useRealTimers()

describe('Authenticate User middleware', () => {
    afterAll(async () => {
        if (client.isReady) {
            await client.quit() // Close the Redis connection
        }
        await mongoose.connection.close()
    })

    it('should return 401 if no authorization header is provided', async () => {
        const response = await request(app).get('/api/v1/instructors')

        // Assertions
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            message: 'Authorization credentials ware not provided!',
        })
    })

    it('should return 401 if the token is not set properly', async () => {
        const response = await request(app)
            .get('/api/v1/instructors')
            .set('Authorization', 'Bearer invalidtoken')

        // Assertions
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            message: 'Authorization credentials ware not provided!',
        })
    })

    it('should call next() and attach user data if the token is valid', async () => {
        // Generate a valid token
        const validToken = generateTestToken({ role: 'instructor' })

        const response = await request(app)
            .get('/api/v1/students')
            .set('Authorization', `Bearer ${validToken}`)

        // Assertions
        expect(response.status).toBe(200)
        expect(response.body).toBeDefined()
    })

    it('should return 401 if the token is expired', async () => {
        // Generate an expired token
        const expiredToken = jwt.sign(
            { id: 1, name: 'John Doe' },
            process.env.JWT_SECRET as string,
            {
                expiresIn: -1, // Expired immediately
            }
        )

        const response = await request(app)
            .get('/api/v1/students')
            .set('Authorization', `Bearer ${expiredToken}`)

        // Assertions
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            message: 'Authorization credentials ware not provided!',
        })
    })
})
