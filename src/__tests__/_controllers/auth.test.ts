import AuthController from '../../controllers/auth'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../../models/User'

// Mock dependencies
jest.mock('bcrypt')
jest.mock('jsonwebtoken')
jest.mock('../../models/User')
jest.mock('../../utils/logger')

describe('AuthController.login', () => {
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
    it('should return 400 if user is not found', async () => {
        const req: any = mockRequest()
        const res = mockResponse()
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
        const mockUser = {
            _id: 'userId',
            role: 'user',
            password: 'hashedPassword',
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

        ;(User.findOne as jest.Mock).mockRejectedValue(
            new Error('Database error')
        )

        await AuthController.login(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Internal server error.',
        })
    })
})
