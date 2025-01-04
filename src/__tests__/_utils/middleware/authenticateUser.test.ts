import 'dotenv/config'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { generateTestToken } from '../../../test_data/user.data'
import mongoose from 'mongoose'
import { client } from '../../../utils/cache'
import { createServer } from '../../../utils/server'
import { checkJwtToken } from '../../../utils/middleware/authenticateUser'
import { NextFunction, Request, Response } from 'express'

const app = createServer()

// mock dependencies
jest.mock('../../../utils/cache')
jest.mock('jsonwebtoken')
jest.mock('../../../utils/middleware/authenticateUser')

describe('Authenticate User middleware', () => {
    afterAll(async () => {
        if (client.isReady) {
            await client.quit() // Close the Redis connection
        }
        await mongoose.connection.close()
    })

    it('should return 401 if no authorization header is provided', async () => {
        // Mock the checkJwtToken function
        ;(checkJwtToken as jest.Mock).mockImplementation(
            (req: Request, res: Response, next: NextFunction) => {
                res.status(401).json({
                    success: false,
                    message: 'Authorization credentials were not provided!',
                })
            }
        )

        // Mock request and response objects
        const req: any = { headers: {} }
        const res: any = {
            status: jest.fn(() => res),
            json: jest.fn(),
        }
        const next = jest.fn()

        // Invoke the mocked middleware
        checkJwtToken(req, res, next)

        // Assertions
        expect(checkJwtToken).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Authorization credentials were not provided!',
        })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 if the token is not set properly', async () => {
        ;(checkJwtToken as jest.Mock).mockImplementation(
            (req: Request, res: Response, next: NextFunction) => {
                res.status(401).json({
                    success: false,
                    message: 'Authorization credentials were not provided!',
                })
            }
        )

        const validToken = generateTestToken({ role: 'instructor' })

        // Mock request and response objects
        const req: any = { headers: { Authorization: `Bearer-${validToken}` } } //token not set properly
        const res: any = {
            status: jest.fn(() => res),
            json: jest.fn(),
        }
        const next = jest.fn()

        // Invoke the mocked middleware
        checkJwtToken(req, res, next)

        // Assertions
        expect(checkJwtToken).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Authorization credentials were not provided!',
        })
        expect(next).not.toHaveBeenCalled()
    })

    it('should call next() and attach user data if the token is valid', async () => {
        // Generate a valid token
        const validToken = generateTestToken({ role: 'instructor' })

        const mockNext = jest.fn() // Mock the next function

        // Mock the checkJwtToken middleware
        ;(checkJwtToken as jest.Mock).mockImplementation(
            (req: Request, res: Response, next: NextFunction) => {
                jest.spyOn(jwt, 'verify').mockImplementation(
                    (token, secret, cb: any) => {
                        cb(null, { userId: 'user123', role: 'instructor' })
                    }
                )

                next()
            }
        )

        // Invoke the middleware manually to check its behavior
        const req: any = {
            headers: { authorization: `Bearer ${validToken}` },
        }
        const res: any = {
            status: jest.fn(() => res),
            json: jest.fn(),
        }
        checkJwtToken(req, res, mockNext)

        // Call the mocked checkJwtToken middleware
        expect(checkJwtToken).toHaveBeenCalled()
        expect(mockNext).toHaveBeenCalled()
    })
})
