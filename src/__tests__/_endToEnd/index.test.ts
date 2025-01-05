import mongoose from 'mongoose'
import request from 'supertest'
import {
    newStudent1,
    newInstructorUser1,
    generateTestToken,
    newInstructorUser2,
    testCourses,
} from '../../test_data/user.data'
import { createServer } from '../../utils/server'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { client } from '../../utils/cache'

const app = createServer()
let instructorsAccessToken: string
let instructorsRefreshToken: string
let studentId: string
let courseCode: string

describe('User End to End', () => {
    beforeAll(async () => {
        const mongoServer = await MongoMemoryServer.create()
        await mongoose.connect(mongoServer.getUri())
    })

    afterAll(async () => {
        await mongoose.disconnect()
        await mongoose.connection.close()
        if (client.isReady) {
            client.quit()
        }
    })

    test('create an instructor', async () => {
        const token = generateTestToken({ role: 'instructor' })

        const response = await request(app)
            .post('/api/v1/instructors')
            .set('Authorization', `Bearer ${token}`) // simulating first instructor
            .send(newInstructorUser1)

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
    })

    test('login as an instructor', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: newInstructorUser1.email,
            password: newInstructorUser1.password,
        })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('refreshToken')

        instructorsAccessToken = response.body.accessToken
        instructorsRefreshToken = response.body.refreshToken
    })

    test('refresh access token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh-token')
            .send({ refreshToken: instructorsRefreshToken })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.accessToken).toBeDefined()

        instructorsAccessToken = response.body.accessToken
    })

    test('create another instructor', async () => {
        const response = await request(app)
            .post('/api/v1/instructors')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)
            .send(newInstructorUser2)

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
    })

    test("verify second instructor's existence", async () => {
        const response2 = await request(app)
            .get('/api/v1/instructors')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)

        expect(response2.status).toBe(200)
        expect(response2.body.success).toBe(true)
        expect(response2.body.instructors.length).toBe(2)
        expect(response2.body.instructors[1].name).toEqual(
            newInstructorUser2.name
        )
    })

    test('create a student', async () => {
        const response = await request(app)
            .post('/api/v1/students')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)
            .send(newStudent1)

        expect(response.status).toBe(201)
        expect(response.body.message).toBe('student created successfully!')
        expect(response.body.data).toHaveProperty('email')
    })

    test('create courses', async () => {
        for (let i = 0; i < 5; i++) {
            const response = await request(app)
                .post('/api/v1/courses')
                .set('Authorization', `Bearer ${instructorsAccessToken}`)
                .send(testCourses[i])

            // Assertions for each course creation
            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Course created successfully!')
        }
    })

    test('fetch all courses', async () => {
        const response = await request(app)
            .get('/api/v1/courses')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('courses')
        expect(Array.isArray(response.body.courses)).toBe(true)
        expect(response.body.courses.length).toBe(5)

        // Verify the properties of each course
        response.body.courses.forEach((course: any, index: number) => {
            expect(course).toHaveProperty('name', testCourses[index].name)
            expect(course).toHaveProperty('code', testCourses[index].code)
            expect(course).toHaveProperty(
                'description',
                testCourses[index].description
            )
            expect(course).toHaveProperty('credits', testCourses[index].credits)
            expect(course).toHaveProperty(
                'semester',
                testCourses[index].semester
            )
            expect(course).toHaveProperty(
                'department',
                testCourses[index].department
            )
        })

        // set courseCode to be the first course in test data
        courseCode = response.body.courses[0].code
    })

    test('fetch the just created student', async () => {
        const response = await request(app)
            .get('/api/v1/students')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBe(1)
        expect(response.body.data[0].name).toBe(newStudent1.name)
        expect(response.body.data[0].level).toBe(newStudent1.level)

        // set student id
        studentId = response.body.data[0]._id
    })

    test('instructor enrolls student in a course', async () => {
        console.log(`Request body id = ${studentId} - ${courseCode}`)
        const response = await request(app)
            .post('/api/v1/enrollments')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)
            .send({ studentId, courseCode })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toEqual('Student enrolled successfully!')
    })
})
