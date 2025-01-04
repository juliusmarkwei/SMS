import { Request, Response, NextFunction } from 'express'
import { Role } from '../../../utils/enums'
import request from 'supertest'
import { generateTestToken, instructors } from '../../../test_data/user.data'
import { client, getOrSetCache } from '../../../utils/cache'
import { createServer } from '../../../utils/server'

const app = createServer()

// mock dependencies
jest.mock('../../../utils/cache')

let token: string
describe('isInstructor Middleware', () => {
    beforeAll(() => {
        token = generateTestToken({ role: Role.INSTRUCTOR })
    })
    beforeEach(() => {
        jest.clearAllMocks()
    })
    afterAll(async () => {
        if (client.isReady) {
            await client.quit() // Close the Redis connection
        }
    })

    it('should grant access if user is an instructor', async () => {
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.user = { role: Role.INSTRUCTOR, id: '123' } // Mock instructor
            next()
        })
        ;(getOrSetCache as jest.Mock).mockImplementation(async () => [
            ...instructors,
        ])

        const response = await request(app)
            .get('/api/v1/instructors')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            success: true,
            instructors,
        })
    })

    it('should deny access if user is not an instructor', async () => {
        token = generateTestToken({ role: Role.STUDENT })
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.user = { role: Role.STUDENT, id: '123' } // Mock student
            next()
        })

        const response = await request(app)
            .get('/api/v1/instructors')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            error: 'Unauthorized!',
        })
    })

    it('should deny access if role is undefined', async () => {
        token = generateTestToken({ role: undefined })
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.user = { role: undefined, id: '123' } as any // Mock user with undefined role
            next()
        })

        const response = await request(app)
            .get('/api/v1/instructors')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
            success: false,
            error: 'Unauthorized!',
        })
    })
})
