import request from 'supertest'
import { generateTestToken } from '../../../test_data/user.data'
import { Role } from '../../../utils/enums'
import User from '../../../models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { client, getOrSetCache } from '../../../utils/cache'
import mongoose, { Types } from 'mongoose'
import { createServer } from '../../../utils/server'

const app = createServer()

// mock dependencies
jest.mock('../../../models/User')
jest.mock('bcrypt')
jest.mock('../../../models/User')
jest.mock('../../../utils/cache')

let token: string

describe('studentRateLimiter Middleware', () => {
    beforeAll(() => {
        token = generateTestToken({ role: Role.STUDENT })
    })
    afterEach(() => {
        jest.clearAllMocks()
    })
    afterAll(async () => {
        if (client.isReady) {
            await client.quit() // Close the Redis connection
        }
        await mongoose.connection.close()
    })

    it('should allow requests under the rate limit for a student', async () => {
        jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true)

        // Send 15 requests and assert they all succeed
        for (let i = 0; i < 15; i++) {
            jest.spyOn(User, 'findOne').mockResolvedValueOnce({
                // mock the user for all request
                _id: '123',
                role: Role.STUDENT,
                email: 'jun@acaugtu.ec',
                password: 'password123',
            })
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'jun@acaugtu.ec',
                    password: 'password123',
                })
            expect(response.status).toBe(200)
        }
    })

    it('should block requests exceeding the rate limit for a student', async () => {
        const courseCode = 'INF123'
        jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true)
        ;(getOrSetCache as jest.Mock).mockImplementation(async () => ({
            name: 'Course 1',
            code: 'INF128',
            credits: 3,
            semester: 'First',
        }))

        for (let i = 0; i < 15; i++) {
            const response = await request(app)
                .get(`/api/v1/courses/${courseCode}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                success: true,
                course: {
                    name: 'Course 1',
                    code: 'INF128',
                    credits: 3,
                    semester: 'First',
                },
            })
        }
        const response = await request(app)
            .get(`/api/v1/courses/${courseCode}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(429)
        expect(response.body).toEqual({
            success: false,
            error: 'Too many requests from students. Please try again later.',
        })
    })

    it('should not apply rate limiter for instructors', async () => {
        token = generateTestToken({ role: Role.INSTRUCTOR })
        jest.spyOn(jwt, 'verify').mockImplementation(async () => ({
            id: '123',
            name: 'Instructor 1',
        }))

        jest.spyOn(bcrypt, 'hash').mockImplementation(
            async () => 'hashed_password123'
        )

        // jest.spyOn(User.prototype, 'save').mockImplementation(async () => true)

        for (let i = 0; i < 20; i++) {
            jest.spyOn(User, 'findOne').mockResolvedValueOnce({
                id: '123',
                name: 'Instructor 1',
                role: 'instructor',
                gender: 'male',
                save: jest.fn().mockResolvedValue(true),
            })
            const response = await request(app)
                .post('/api/v1/auth/password-reset?token=some-secret-token')
                .send({
                    password: 'password123',
                    confirmPassword: 'password123',
                })

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                success: true,
                message: 'Password successfully reset!',
            })
        }
    })
})
