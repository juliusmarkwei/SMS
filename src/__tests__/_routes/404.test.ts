import request from 'supertest'
import app from '../../script'
import _404Controller from '../../controllers/404'
import { generateTestToken } from '../../test_data/user.data'

let token: string

describe('404 Route', () => {
    beforeAll(() => {
        token = generateTestToken({ role: 'instructor' })
    })
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return 404 status with appropriate message for non-existent routes', async () => {
        const response = await request(app).get('/non-existent-route')

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            message: `The requested endpoint/resource at '/non-existent-route' does not exist. Check out our docs at /api/v1/docs to learn more`,
        })
    })

    it('should return the correct 404 message for a POST request to a non-existent route', async () => {
        const response = await request(app).post('/another-fake-route').send({
            data: 'test',
        })

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            message: `The requested endpoint/resource at '/another-fake-route' does not exist. Check out our docs at /api/v1/docs to learn more`,
        })
    })

    it('should return the correct 404 message for PUT requests to a non-existent route', async () => {
        const response = await request(app).put('/yet-another-fake-route')

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            message: `The requested endpoint/resource at '/yet-another-fake-route' does not exist. Check out our docs at /api/v1/docs to learn more`,
        })
    })

    it('should handle query parameters correctly in the 404 response', async () => {
        const response = await request(app).get('/not-found?query=test')

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            message: `The requested endpoint/resource at '/not-found?query=test' does not exist. Check out our docs at /api/v1/docs to learn more`,
        })
    })

    it('should return the correct 404 message for a post request to a /login-mistake route', async () => {
        const response = await request(app).post('/login-mistake').send({
            data: 'test',
        })

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            message: `The requested endpoint/resource at '/login-mistake' does not exist. Check out our docs at /api/v1/docs to learn more`,
        })
    })

    it('should return the correct 404 message for a GET request to a /instructors:instructorId route', async () => {
        const response = await request(app)
            .put('/api/v1/instructors-mistake/instructorId123')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            message: `The requested endpoint/resource at '/api/v1/instructors-mistake/instructorId123' does not exist. Check out our docs at /api/v1/docs to learn more`,
        })
    })
})
