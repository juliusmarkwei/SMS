import mongoose from 'mongoose'
import { connectTestDB } from '../../utils/dbConfig'
import request from 'supertest'
import app from '../../script'
import {
    newStudent1,
    newInstructorUser,
    generateTestToken,
} from '../../test_data/user.data'

describe('User End to End', () => {
    beforeAll(async () => {
        await connectTestDB()
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    // test('create an instructor', async () => {
    //     const token = generateTestToken({ role: 'instructor' })

    //     const response = await request(app)
    //         .post('/api/v1/instructors')
    //         .set('Authorization', `Bearer ${token}`)
    //         .send(newInstructorUser)

    //     expect(response.status).toBe(201)
    //     expect(response.body.success).toBe(true)
    // })

    // test('login as an instructor', async () => {
    //     const response = await request(app).post('/api/v1/auth/login').send({
    //         email: newInstructorUser.email,
    //         password: newInstructorUser.password,
    //     })

    //     expect(response.status).toBe(200)
    //     expect(response.body.success).toBe(true)
    //     expect(response.body.data).toHaveProperty('refreshToken')
    // })
})
