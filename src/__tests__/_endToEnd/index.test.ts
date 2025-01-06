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
let studentsAccessToken: string
let studentsRefreshToken: string
let studentId: string
let course1: { [key: string]: string } = {}
let course2: { [key: string]: string } = {}
let enrollmentId: string

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
        console.log(
            `The student data is = ${JSON.stringify(response.body.data[0]._id)}`
        )
        studentId = response.body.data[0]._id
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

        // set course1 & course2 to be the first and second course in test data respectively
        course1 = response.body.courses[0]
        course2 = response.body.courses[1]
    })

    test('instructor enrolls a student in a course', async () => {
        const response = await request(app)
            .post('/api/v1/enrollments')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)
            .send({ studentId, courseCode: course1.code })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toEqual('Student enrolled successfully!')
    })

    test('fetch all enrollments', async () => {
        const response = await request(app)
            .get('/api/v1/enrollments')
            .set('Authorization', `Bearer ${instructorsAccessToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.enrollments.length).toBe(1)

        enrollmentId = response.body.enrollments[0]._id
    })

    test('login as a student', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({
            email: newStudent1.email,
            password: newStudent1.password,
        })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('refreshToken')

        studentsAccessToken = response.body.accessToken
        studentsRefreshToken = response.body.refreshToken
    })

    test('get all courses for a student', async () => {
        const response = await request(app)
            .get(`/api/v1/enrollments/student/${studentId}`)
            .set('Authorization', `Bearer ${studentsAccessToken}`) // student fetched their courses

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.courses.length).toBe(1)
        expect(response.body.courses[0].code).toBe(course1.code)
    })

    test('student tries to enrolls themselves in an already enrolled course', async () => {
        const response = await request(app)
            .post('/api/v1/enrollments')
            .set('Authorization', `Bearer ${studentsAccessToken}`)
            .send({ studentId, courseCode: course1.code })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toEqual(
            `Student is already enrolled in course ${course1.code}`
        )
    })

    test("student enrolls themselves in a course they're not already enrolled in", async () => {
        const response = await request(app)
            .post('/api/v1/enrollments')
            .set('Authorization', `Bearer ${studentsAccessToken}`)
            .send({ studentId, courseCode: course2.code })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toEqual('Student enrolled successfully!')
    })

    test('student gets initial enrollmentId', async () => {
        const response = await request(app)
            .get('/api/v1/enrollments')
            .set('Authorization', `Bearer ${studentsAccessToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.enrollments.length).toBe(2)

        enrollmentId = response.body.enrollments[0]._id
    })

    test('student deletes initial enrollment', async () => {
        const deleteResponse = await request(app)
            .delete(`/api/v1/enrollments/${enrollmentId}`)
            .set('Authorization', `Bearer ${studentsAccessToken}`)

        expect(deleteResponse.status).toBe(200)
        expect(deleteResponse.body.success).toBe(true)
        expect(deleteResponse.body.message).toEqual(
            'Enrollment deleted successfully'
        )
    })

    test('student tries to delete a course', async () => {
        const deleteResponse = await request(app)
            .delete(`/api/v1/courses/${course1.code}`)
            .set('Authorization', `Bearer ${studentsAccessToken}`)

        expect(deleteResponse.status).toBe(401)
        expect(deleteResponse.body.success).toBe(false)
        expect(deleteResponse.body.error).toEqual('Unauthorized!')
    })
})
