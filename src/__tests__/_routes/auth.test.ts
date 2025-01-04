import 'dotenv/config'
import request from 'supertest'
import User from '../../models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendResetPasswordEmail } from '../../utils/mailer'
import mongoose from 'mongoose'
import { createServer } from '../../utils/server'

const app = createServer()

// Mock dependencies
jest.mock('../../models/User')
jest.mock('bcrypt')
jest.mock('jsonwebtoken')
jest.mock('../../utils/mailer')

const baseUrl = '/api/v1/auth'

describe('AuthController', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })
    afterAll(async () => {
        await mongoose.connection.close()
    })

    describe('POST /login', () => {
        it('should return 400 for invalid credentials', async () => {
            ;(User.findOne as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .post(`${baseUrl}/login`)
                .send({ email: 'test@example.com', password: 'wrongpassword' })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Bad credentials!')
        })

        it('should return 200 and tokens for valid credentials', async () => {
            const user = {
                _id: 'userId',
                email: 'test@example.com',
                password: 'hashedpassword',
                role: 'user',
            }

            ;(User.findOne as jest.Mock).mockResolvedValue(user)
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
            ;(jwt.sign as jest.Mock)
                .mockReturnValueOnce('accessToken')
                .mockReturnValueOnce('refreshToken')

            const response = await request(app)
                .post(`${baseUrl}/login`)
                .send({ email: 'test@example.com', password: 'password123' })

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.accessToken).toBe('accessToken')
            expect(response.body.refreshToken).toBe('refreshToken')
        })
    })

    describe('POST /refresh-token', () => {
        it('should return 400 if refresh token is missing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh-token')
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Refresh token is required!')
        })

        it('should return 200 with a new access token for a valid refresh token', async () => {
            const user = { _id: 'userId', role: 'user' }
            const decodedToken = { id: 'userId', type: 'refreshToken' }

            ;(jwt.verify as jest.Mock).mockReturnValue(decodedToken)
            ;(User.findById as jest.Mock).mockResolvedValue(user)
            ;(jwt.sign as jest.Mock).mockReturnValue('newAccessToken')

            const response = await request(app)
                .post(`${baseUrl}/refresh-token`)
                .send({ refreshToken: 'validRefreshToken' })

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.accessToken).toBe('newAccessToken')
        })
    })

    describe('POST /forgot-password', () => {
        it('should return 400 if email is not found', async () => {
            ;(User.findOne as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .post(`${baseUrl}/forgot-password`)
                .send({ email: 'nonexistent@example.com' })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Check your email and try again!')
        })

        it('should send a reset email for a valid user', async () => {
            const user = { _id: 'userId', email: 'test@example.com' }
            ;(User.findOne as jest.Mock).mockResolvedValue(user)
            ;(sendResetPasswordEmail as jest.Mock).mockResolvedValue({
                success: true,
            })

            const response = await request(app)
                .post(`${baseUrl}/forgot-password`)
                .send({ email: 'test@example.com' })

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe(
                'Check your inbox for a password reset link'
            )
        })
    })

    describe('POST /password-reset', () => {
        it('should return 400 if passwords do not match', async () => {
            const response = await request(app)
                .post(`${baseUrl}/password-reset`)
                .send({
                    password: 'password123',
                    confirmPassword: 'differentPassword',
                })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Passwords do not match')
        })

        it('should reset the password for a valid token', async () => {
            const user = {
                _id: 'userId',
                password: 'oldPassword',
                save: jest.fn(),
            }

            const decodedToken = { userId: 'userId' }
            ;(jwt.verify as jest.Mock).mockReturnValue(decodedToken)
            ;(User.findOne as jest.Mock).mockResolvedValue(user)
            ;(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword')

            const response = await request(app)
                .post(`${baseUrl}/password-reset`)
                .query({ token: 'validToken' })
                .send({
                    password: 'newPassword',
                    confirmPassword: 'newPassword',
                })

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Password successfully reset!')
            expect(user.password).toBe('newHashedPassword')
        })
    })
})
