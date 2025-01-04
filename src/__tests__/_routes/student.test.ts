import request from 'supertest'
import { createServer } from '../../utils/server'
import User from '../../models/User'
import Student from '../../models/Student'
import { Role } from '../../utils/enums'
import mongoose, { Types } from 'mongoose'
import { generateTestToken } from '../../test_data/user.data'
import { client, getOrSetCache } from '../../utils/cache'
import { emailNewUsers } from '../../utils/mailer'

const app = createServer()

jest.mock('../../models/User')
jest.mock('../../models/Student')
jest.mock('../../utils/mailer')
jest.mock('../../utils/cache')

const baseUrl = '/api/v1/students'
let token: string

describe('Student Routes', () => {
    beforeAll(() => {
        token = generateTestToken({ role: 'instructor' }) // default role is instructor
    })
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterAll(async () => {
        if (client.isReady) {
            await client.quit() // Close the Redis connection
        }
        await mongoose.connection.close()
    })

    const mockStudentId = 'studId123'
    const mockUserId = 'userId123'
    const mockPassword = 'password123'
    const hashedPassword = `hashed_${mockPassword}`

    const mockStudent = {
        _id: mockStudentId,
        user: mockUserId,
        level: 3,
        cgpa: 3.8,
    }

    const mockUser = {
        _id: mockUserId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: mockPassword,
        role: Role.STUDENT,
        phone: '1234567890',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
    }

    describe('POST /students', () => {
        it('should create a new student successfully', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true)
            ;(User.findOne as jest.Mock).mockImplementation(() => null)
            ;(User.prototype.save as jest.Mock).mockResolvedValue(mockUser)
            ;(Student.prototype.save as jest.Mock).mockResolvedValue(
                mockStudent
            )
            ;(emailNewUsers as jest.Mock).mockImplementation(() => true)

            const response = await request(app)
                .post(`${baseUrl}`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockUser)

            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('student created successfully!')
        })

        it('should return 400 if the student already exists', async () => {
            ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)

            const response = await request(app)
                .post(`${baseUrl}`)
                .set('Authorization', `Bearer ${token}`)
                .send(mockUser)

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Student already exists!')
        })

        it('should return 500 if an internal server error occurs', async () => {
            ;(User.findOne as jest.Mock).mockImplementation(() => {
                throw new Error('Database error')
            })

            const response = await request(app)
                .post(`${baseUrl}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Jeremiah Alvarado',
                    email: 'jeremiah.alvarado@example.com',
                    password: 'password123',
                    phone: '1234567890',
                    gender: 'male',
                    dateOfBirth: '1990-01-01',
                    address: '123 Main Street',
                    level: 200,
                    cgpa: 3.3,
                })

            expect(response.body.error).toBe('Internal server error.')
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
        })
    })

    describe('GET /students/:studentId', () => {
        it('should return 400 if studentId is invalid', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(false)
            const response = await request(app)
                .get(`${baseUrl}/invalidId`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe(
                'studentId not provided or is invalid'
            )
        })

        it('should return the student if found', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true)
            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockStudent)

            const response = await request(app)
                .get(`${baseUrl}/${mockStudentId}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.student).toBeDefined()
        })

        it('should return 404 if the student is not found', async () => {
            jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true)
            ;(Student.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue(null),
            }) as jest.Mock
            ;(getOrSetCache as jest.Mock).mockImplementation(
                async (key, callback) => {
                    return await callback()
                }
            )
            const response = await request(app)
                .get(`${baseUrl}/${mockStudentId}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.body.error).toBe('Student not found')
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
        })
    })

    describe('PUT /students/:studentId', () => {
        it('should update the student successfully', async () => {
            ;(Student.findById as jest.Mock).mockResolvedValue(mockStudent)
            ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser)
            ;(Student.findByIdAndUpdate as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const response = await request(app)
                .put(`${baseUrl}/${mockStudentId}`)
                .send({
                    name: 'Jane Doe',
                    phone: '0987654321',
                    address: '456 Another Street',
                })
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Student updated successfully')
        })

        it('should return 404 if the student is not found', async () => {
            ;(Student.findByIdAndUpdate as jest.Mock).mockResolvedValue(null)
            ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .put(`${baseUrl}/${mockStudentId}`)
                .send({
                    name: 'Jane Doe',
                    phone: '0987654321',
                    address: '456 Another Street',
                })
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Student not found')
        })
    })

    describe('DELETE /students/:studentId', () => {
        it('should delete the student successfully', async () => {
            ;(Student.findByIdAndDelete as jest.Mock).mockResolvedValue(
                mockStudent
            )
            ;(User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser)

            const response = await request(app)
                .delete(`${baseUrl}/${mockStudentId}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Student deleted successfully')
        })

        it('should return 404 if the student is not found', async () => {
            ;(Student.findByIdAndDelete as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .delete(`${baseUrl}/${mockStudentId}`)
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Student not found')
        })
    })
})
