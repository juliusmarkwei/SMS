import AuthController from '../../controllers/auth'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../../models/User'
import { sendResetPasswordEmail } from '../../utils/mailer'
import { requestBodyErrorsInterrupt } from '../../utils/middleware/handleReqBodyErrors'
import { matchedData } from 'express-validator'

// Mock dependencies
jest.mock('bcrypt')
jest.mock('jsonwebtoken')
jest.mock('../../models/User')
jest.mock('../../utils/logger')
jest.mock('../../utils/mailer')
jest.mock('express-validator')
jest.mock('../../utils/middleware/handleReqBodyErrors', () => ({
    requestBodyErrorsInterrupt: jest.fn(),
}))

describe('Authentication Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })
    const mockRequest = (body = {}, params = {}, user = {}, query = {}) => ({
        body,
        params,
        user,
        query,
    })

    const mockResponse = () => {
        const res: any = {}
        res.status = jest.fn().mockReturnValue(res)
        res.json = jest.fn().mockReturnValue(res)
        return res
    }

    describe('login a user', () => {
        it('should return 400 if user is not found', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            ;(matchedData as jest.Mock).mockReturnValue({
                email: 'kako@hoic.ly',
                password: 'password456',
            })
            ;(User.findOne as jest.Mock).mockResolvedValue(null)

            await AuthController.login(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Bad credentials!',
            })
        })

        it('should return 400 if password is incorrect', async () => {
            const req: any = mockRequest()
            const res = mockResponse()
            const mockUser = { password: 'hashedPassword' }

            ;(matchedData as jest.Mock).mockReturnValue({
                email: 'kako@hoic.ly',
                password: 'password456',
            })
            ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

            await AuthController.login(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Bad credentials!',
            })
        })

        it('should return 200 with tokens if login is successful', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            ;(matchedData as jest.Mock).mockReturnValue({
                email: 'kako@hoic.ly',
                password: 'password456',
            })

            const mockUser = {
                _id: 'userId',
                role: 'student',
                password: 'hashedPassword456',
            }
            const mockAccessToken = 'accessToken'
            const mockRefreshToken = 'refreshToken'
            ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
            ;(jwt.sign as jest.Mock)
                .mockReturnValueOnce(mockAccessToken)
                .mockReturnValueOnce(mockRefreshToken)

            await AuthController.login(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            })
        })

        it('should return 500 if an error occurs', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            ;(matchedData as jest.Mock).mockReturnValue({
                email: req.body.email,
            })
            ;(User.findOne as jest.Mock).mockRejectedValue(
                new Error('Internal server error.')
            )

            await AuthController.login(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Internal server error.',
            })
        })
    })

    describe('refresh access-token', () => {
        it('should return 400 if refreshToken is not provided', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Refresh token is required!',
            })
        })

        it('should return 400 if refreshToken is invalid', async () => {
            const req: any = mockRequest({ refreshToken: 'invalid-token' })
            const res = mockResponse()
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token')
            })

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid token',
            })
        })

        it('should return 400 if decoded token type is not refreshToken', async () => {
            const req: any = mockRequest({
                refreshToken: 'valid-refresh-token',
            })
            const res = mockResponse()
            ;(jwt.verify as jest.Mock).mockReturnValue({
                type: 'accessToken',
            })

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid refresh token!',
            })
        })

        it('should return 400 if user is not found', async () => {
            const req: any = mockRequest({
                refreshToken: 'valid-refresh-token',
            })
            const res = mockResponse()
            ;(jwt.verify as jest.Mock).mockReturnValue({
                id: 'user-id',
                type: 'refreshToken',
            })
            ;(User.findById as jest.Mock).mockResolvedValue(null)

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found or invalid refresh token!',
            })
        })

        it('should return 200 with a new access token', async () => {
            const req: any = mockRequest({
                refreshToken: 'valid-refresh-token',
            })
            const res = mockResponse()
            const mockUser = { _id: 'user-id', role: 'user' }
            ;(jwt.verify as jest.Mock).mockReturnValue({
                id: 'user-id',
                type: 'refreshToken',
            })
            ;(User.findById as jest.Mock).mockResolvedValue(mockUser)
            ;(jwt.sign as jest.Mock).mockReturnValue('new-access-token')

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                accessToken: 'new-access-token',
            })
        })

        it('should return 401 if refreshToken is expired', async () => {
            const req: any = mockRequest({ refreshToken: 'expired-token' })
            const res = mockResponse()

            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                const error: any = new Error('Refresh token has expired!')
                error.code = 401
                throw error
            })

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Refresh token has expired!',
            })
        })

        it('should return 403 if refreshToken is tampered with', async () => {
            const req: any = mockRequest({ refreshToken: 'tampered-token' })
            const res = mockResponse()

            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                const error: any = new Error('Invalid refresh token!')
                error.code = 403
                throw error
            })

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid refresh token!',
            })
        })

        it('should return 400 if refreshToken is malformed', async () => {
            const req: any = mockRequest({ refreshToken: 'malformed-token' })
            const res = mockResponse()

            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                const error: any = new Error('Invalid refresh token!')
                error.code = 400
                throw error
            })

            await AuthController.refreshAccessToken(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid refresh token!',
            })
        })
    })

    describe('forgot password', () => {
        it('should return 400 if user is not found', async () => {
            const req: any = mockRequest({
                email: 'nonexistent@example.com',
            })
            const res = mockResponse()

            ;(matchedData as jest.Mock).mockReturnValue({
                email: req.body.email,
            })
            ;(User.findOne as jest.Mock).mockResolvedValue(null)

            await AuthController.forgotPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Check your email and try again!',
            })
        })

        it('should return 500 if email fails to send', async () => {
            const req: any = mockRequest({ email: 'user@example.com' })
            const res = mockResponse()
            const mockUser = { _id: 'user-id', email: 'user@example.com' }

            ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
            ;(sendResetPasswordEmail as jest.Mock).mockResolvedValue({
                success: false,
            })

            await AuthController.forgotPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Error sending email, please try again',
            })
        })

        it('should return 400 if email is not provided', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            // mock requestBodyErrorsInterrupt
            ;(requestBodyErrorsInterrupt as jest.Mock).mockImplementation(
                (req, res) => {
                    res.status(400).json({
                        success: false,
                        error: 'Email is required!',
                    })
                    return true
                }
            )

            await AuthController.forgotPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Email is required!',
            })
        })

        it('should return 400 if email format is invalid', async () => {
            const req: any = mockRequest({ email: 'invalid-email' })
            const res = mockResponse()

            ;(requestBodyErrorsInterrupt as jest.Mock).mockImplementation(
                (req, res) => {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid email format!',
                    })
                    return true
                }
            )

            await AuthController.forgotPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid email format!',
            })
        })

        it('should return 200 if email is sent successfully', async () => {
            const req: any = mockRequest({ email: 'user@example.com' })
            const res = mockResponse()
            const mockUser = { _id: 'user-id', email: 'user@example.com' }

            ;(requestBodyErrorsInterrupt as jest.Mock).mockReturnValue(false)
            ;(matchedData as jest.Mock).mockReturnValue({
                email: 'user@example.com',
            })
            ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
            ;(sendResetPasswordEmail as jest.Mock).mockResolvedValue({
                success: true,
            })

            await AuthController.forgotPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Check your inbox for a password reset link',
            })
        })
    })

    describe('reset password', () => {
        it('should return 400 if passwords do not match', async () => {
            const req: any = mockRequest({
                password: 'password123',
                confirmPassword: 'password456',
            })
            const res = mockResponse()
            ;(matchedData as jest.Mock).mockReturnValue({
                password: 'password123',
                confirmPassword: 'password456',
            })

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Passwords do not match',
            })
        })

        it('should return 400 if password is too weak', async () => {
            const req: any = mockRequest({
                password: '123',
                confirmPassword: '123',
            })
            const res = mockResponse()

            ;(requestBodyErrorsInterrupt as jest.Mock).mockImplementation(
                (req, res) => {
                    res.status(400).json({
                        success: false,
                        error: 'Password is too weak!',
                    })
                    return true
                }
            )

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Password is too weak!',
            })
        })

        it('should return 400 if token is not provided', async () => {
            const req: any = mockRequest(
                {
                    password: 'password123',
                    confirmPassword: 'password123',
                },
                {},
                {},
                {}
            )
            const res = mockResponse()

            ;(requestBodyErrorsInterrupt as jest.Mock).mockReturnValue(false)
            ;(matchedData as jest.Mock).mockReturnValue({
                password: 'password123',
                confirmPassword: 'password123',
            })

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token is required!',
                forgetPasswordURL: '/api/v1/auth/forgot-password',
            })
        })

        it('should return 400 if token is invalid', async () => {
            const req: any = mockRequest(
                {
                    password: 'password123',
                    confirmPassword: 'password123',
                },
                {},
                {},
                { token: 'invalid-token' }
            )
            const res = mockResponse()

            ;(requestBodyErrorsInterrupt as jest.Mock).mockReturnValue(false)
            ;(matchedData as jest.Mock).mockReturnValue({
                password: 'password123',
                confirmPassword: 'password123',
            })
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                return null
            })

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token is invalid!',
                forgetPasswordURL: '/api/v1/auth/forgot-password',
            })
        })

        it('should return 400 if user is not found for token', async () => {
            const req: any = mockRequest(
                {
                    password: 'password123',
                    confirmPassword: 'password123',
                },
                {},
                {},
                { token: 'valid-token' }
            )
            const res = mockResponse()

            ;(requestBodyErrorsInterrupt as jest.Mock).mockReturnValue(false)
            ;(matchedData as jest.Mock).mockReturnValue({
                password: 'password123',
                confirmPassword: 'password123',
            })
            ;(jwt.verify as jest.Mock).mockReturnValue({
                id: 'nonexistent-user-id',
            })
            ;(User.findOne as jest.Mock).mockResolvedValue(null)

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                forgetPasswordURL: '/api/v1/auth/forgot-password',
                error: 'Token expired, request for a new link!',
            })
        })

        it('should return 400 if token signature is invalid', async () => {
            const req: any = mockRequest(
                {
                    password: 'password123',
                    confirmPassword: 'password123',
                },
                {},
                {},
                { token: 'invalid-signature-token' }
            )
            const res = mockResponse()

            ;(matchedData as jest.Mock).mockReturnValue({
                password: 'password123',
                confirmPassword: 'password123',
            })
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                return null
            })

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token is invalid!',
                forgetPasswordURL: '/api/v1/auth/forgot-password',
            })
        })

        it('should return 200 if password is reset successfully', async () => {
            const req: any = mockRequest(
                {
                    password: 'newPassword123',
                    confirmPassword: 'newPassword123',
                },
                {},
                {},
                { token: 'valid-token' }
            )
            const res = mockResponse()
            const mockUser = { save: jest.fn() }

            ;(matchedData as jest.Mock).mockReturnValue({
                password: 'password123',
                confirmPassword: 'password123',
            })
            ;(jwt.verify as jest.Mock).mockReturnValue({ id: 'user-id' })
            ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
            ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123')

            await AuthController.resetPassword(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password successfully reset!',
            })
            expect(mockUser.save).toHaveBeenCalled()
        })
    })
})
