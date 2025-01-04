import request from 'supertest'
import Course from '../../models/Course'
import { client, getOrSetCache } from '../../utils/cache'
import { generateTestToken } from '../../test_data/user.data'
import mongoose from 'mongoose'
import { createServer } from '../../utils/server'

const app = createServer()

// Mock dependencies
jest.mock('../../models/Course')
jest.mock('../../utils/cache')

const baseURL = '/api/v1/courses'
let token: string

describe('Course Routes', () => {
    beforeAll(() => {
        token = generateTestToken({ role: 'instructor' })
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

    describe('GET /courses', () => {
        it('should return a paginated list of courses', async () => {
            const mockCourses = [
                { name: 'Course 1', code: 'CSC321' },
                { name: 'Course 2', code: 'INF400' },
            ]
            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockCourses)
            ;(Course.countDocuments as jest.Mock).mockResolvedValue(20)

            const response = await request(app)
                .get(`${baseURL}/?page=1&limit=2`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.courses).toEqual(mockCourses)
            expect(response.body.totalPages).toBe(10)
        })

        it('should return 404 if no courses are found', async () => {
            ;(getOrSetCache as jest.Mock).mockResolvedValue([])
            ;(Course.countDocuments as jest.Mock).mockResolvedValue(0)

            const response = await request(app)
                .get(`${baseURL}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(404)
            expect(response.body.message).toBe('No courses found')
        })

        it('should handle server errors', async () => {
            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            const response = await request(app)
                .get(`${baseURL}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(500)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('GET /courses/:courseCode', () => {
        it('should return a single course by courseCode', async () => {
            const mockCourse = { name: 'Course 1', code: 'CSC321' }
            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockCourse)

            const response = await request(app)
                .get(`${baseURL}/CSC321`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.course).toEqual(mockCourse)
        })

        it('should return 404 if the course is not found', async () => {
            ;(getOrSetCache as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .get(`${baseURL}/CSC321`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(404)
            expect(response.body.message).toBe(
                'Course with code CSC321 not found'
            )
        })

        it('should handle server errors', async () => {
            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            const response = await request(app)
                .get(`${baseURL}/CSC321`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(500)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('POST /courses', () => {
        it('should create a new course', async () => {
            const mockCourse = {
                name: 'Course 1',
                code: 'AFT235',
                description: 'Test description',
                credits: 3,
                semester: 'First',
                department: 'African Studies',
            }
            ;(Course.prototype.save as jest.Mock).mockResolvedValue(mockCourse)

            const response = await request(app)
                .post(`${baseURL}`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockCourse)

            expect(response.status).toBe(201)
            expect(response.body.message).toBe('Course created successfully!')
        })

        it('should return 400 for duplicate course codes', async () => {
            // Mock the error for duplicate keys
            const mockError = {
                code: 11000,
                keyPattern: { code: 1 },
                keyValue: { code: 'AFT235' },
            }
            ;(Course.prototype.save as jest.Mock).mockRejectedValue(mockError)

            const response = await request(app)
                .post(`${baseURL}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Course 1',
                    code: 'AFT235',
                    description: 'Some description',
                    credits: 3,
                    semester: 'First',
                    department: 'Communication',
                })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe(
                'A course with the same code (AFT235) already exists.'
            )
        })
    })

    describe('PUT /courses/:courseCode', () => {
        it('should update an existing course', async () => {
            const mockUpdatedCourse = {
                name: 'Updated Course',
                code: 'CSC321',
            }
            ;(Course.findOneAndUpdate as jest.Mock).mockResolvedValue(
                mockUpdatedCourse
            )

            const response = await request(app)
                .put(`${baseURL}/CSC321`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Course', code: 'CSC321' })

            expect(response.status).toBe(200)
            expect(response.body.message).toBe('Course updated successfully!')
        })

        it('should return 404 if the course is not found', async () => {
            ;(Course.findOneAndUpdate as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .put(`${baseURL}/CSC321`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Course', code: 'CSC321' })

            expect(response.status).toBe(404)
            expect(response.body.message).toBe(
                'Course with code CSC321 not found'
            )
        })
    })

    describe('DELETE /courses/:courseCode', () => {
        it('should delete a course', async () => {
            const mockCourse = { name: 'Course 1', code: 'CSC321' }
            ;(Course.findOneAndDelete as jest.Mock).mockResolvedValue(
                mockCourse
            )

            const response = await request(app)
                .delete(`${baseURL}/CSC321`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.message).toBe('Course deleted successfully!')
        })

        it('should return 404 if the course is not found', async () => {
            ;(Course.findOneAndDelete as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .delete(`${baseURL}/C1`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(404)
            expect(response.body.message).toBe('Course with code C1 not found')
        })
    })
})
