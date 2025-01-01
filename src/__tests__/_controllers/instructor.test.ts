import bcrypt from 'bcrypt'
import { matchedData, validationResult } from 'express-validator'
import InstructorController from '../../controllers/instructor'
import User from '../../models/User'
import Instructor from '../../models/Instructor'
import Course from '../../models/Course'
import { emailNewUsers } from '../../utils/mailer'
import { getOrSetCache } from '../../utils/cache'
import { requestBodyErrorsInterrupt } from '../../utils/middleware/handleReqBodyErrors'

jest.mock('bcrypt')
jest.mock('../../models/User')
jest.mock('../../models/Instructor')
jest.mock('../../models/Course')
jest.mock('../../utils/mailer')
jest.mock('../../utils/cache')
jest.mock('express-validator')
jest.mock('../../utils/middleware/handleReqBodyErrors', () => ({
    requestBodyErrorsInterrupt: jest.fn(),
}))

describe('Instructor Controller', () => {
    const mockRequest = (body = {}, params = {}, user = {}) => ({
        body,
        params,
        user,
    })

    const mockResponse = () => {
        const res: any = {}
        res.status = jest.fn().mockReturnValue(res)
        res.json = jest.fn().mockReturnValue(res)
        return res
    }

    const mockMatchedData = (data: any) => {
        ;(matchedData as jest.Mock).mockReturnValue(data)
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('create an Instructor', () => {
        it('should create a new instructor and return success', async () => {
            const req: any = mockRequest({
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                phone: '1234567890',
                gender: 'male',
                dateOfBirth: '1990-01-01',
                address: '123 Main St',
                department: 'Mathematics',
                salary: 50000,
                courses: ['course1', 'course2'],
            })
            const res = mockResponse()

            mockMatchedData(req.body)

            // Mocking User.findOne
            ;(User.findOne as jest.Mock).mockResolvedValue(null)

            // Mocking bcrypt.hash
            ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')

            // Mocking bcrypt.genSalt
            ;(bcrypt.genSalt as jest.Mock).mockResolvedValue(10)

            // Mocking Course.find
            ;(Course.find as jest.Mock).mockResolvedValue([
                { _id: 'course1' },
                { _id: 'course2' },
            ])

            // Mocking user and instructor save
            ;(User.prototype.save as jest.Mock).mockResolvedValue({
                name: 'John Doe',
                email: 'john.doe@example.com',
            })
            ;(Instructor.prototype.save as jest.Mock).mockResolvedValue({})

            // Mocking emailNewUsers
            ;(emailNewUsers as jest.Mock).mockResolvedValue(true)
            ;(validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([
                    {
                        msg: 'Invalid value',
                        location: 'body',
                        param: 'name',
                    },
                ]),
            })
            ;(requestBodyErrorsInterrupt as jest.Mock).mockReturnValue(false)

            await InstructorController.createInstructor(req, res)

            expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email })
            expect(bcrypt.hash).toHaveBeenCalledWith(
                req.body.password,
                expect.any(Number)
            )
            expect(Course.find).toHaveBeenCalledWith({
                _id: { $in: req.body.courses },
            })
            expect(User.prototype.save).toHaveBeenCalled()
            expect(Instructor.prototype.save).toHaveBeenCalled()
            expect(matchedData).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'instructor created successfully!',
            })
        })

        it('should return an error if the user already exists', async () => {
            const req: any = mockRequest({ email: 'john.doe@example.com' })
            const res = mockResponse()

            mockMatchedData(req.body)
            ;(User.findOne as jest.Mock).mockResolvedValue({})

            await InstructorController.createInstructor(req, res)

            expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email })
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Instructor already exists!',
            })
        })

        it('should return an error if invalid courses are provided', async () => {
            const req: any = mockRequest({
                courses: ['invalidCourseId'],
            })
            const res = mockResponse()

            mockMatchedData(req.body)
            ;(User.findOne as jest.Mock).mockResolvedValue(null)
            ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
            ;(Course.find as jest.Mock).mockResolvedValue([])

            await InstructorController.createInstructor(req, res)

            expect(Course.find).toHaveBeenCalledWith({
                _id: { $in: req.body.courses },
            })
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid courses provided',
            })
        })
    })

    describe('fetch all Instructors', () => {
        it('should return a list of all instructors', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            const instructors = [
                {
                    user: {
                        name: 'John Doe',
                        email: 'john.doe@example.com',
                        phone: '1234567890',
                    },
                    department: 'Mathematics',
                    salary: 50000,
                },
            ]

            ;(getOrSetCache as jest.Mock).mockResolvedValue(instructors)

            await InstructorController.getAllInstructors(req, res)

            expect(getOrSetCache).toHaveBeenCalledWith(
                'instructors:all',
                expect.any(Function)
            )
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                instructors,
            })
        })

        it('should handle errors when fetching instructors', async () => {
            const req: any = mockRequest()
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Cache error')
            )

            await InstructorController.getAllInstructors(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Cache error',
            })
        })
    })

    describe('fetch an Instructor', () => {
        it('should return instructor details by ID', async () => {
            const req: any = mockRequest({}, { instructorId: '12345' })
            const res = mockResponse()

            const instructor = {
                user: {
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                },
                department: 'Mathematics',
                salary: 50000,
            }

            ;(getOrSetCache as jest.Mock).mockResolvedValue(instructor)

            await InstructorController.getInstructorById(req, res)

            expect(getOrSetCache).toHaveBeenCalledWith(
                `instructor:${req.params.instructorId}`,
                expect.any(Function)
            )
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: instructor,
            })
        })

        it('should return an error if instructor is not found', async () => {
            const req: any = mockRequest({}, { instructorId: '12345' })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockResolvedValue(null)

            await InstructorController.getInstructorById(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Instructor not found',
            })
        })
    })

    describe('update an Instructor', () => {
        it('should update the instructor details successfully', async () => {
            const req: any = mockRequest(
                {
                    name: 'Jane Doe',
                    phone: '9876543210',
                    department: 'Physics',
                    salary: 60000,
                },
                { instructorId: '12345' },
                { id: 'userId123' }
            )
            const res = mockResponse()

            mockMatchedData(req.body)

            const updatedInstructor = {
                _id: '12345',
                name: 'Jane Doe',
                phone: '9876543210',
                department: 'Physics',
                salary: 60000,
            }

            ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
                name: 'Jane Doe',
            })
            ;(Instructor.findByIdAndUpdate as jest.Mock).mockResolvedValue(
                updatedInstructor
            )

            await InstructorController.updateInstructor(req, res)

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(req.user.id, {
                name: req.body.name,
                phone: req.body.phone,
            })
            expect(Instructor.findByIdAndUpdate).toHaveBeenCalledWith(
                req.params.instructorId,
                {
                    department: req.body.department,
                    salary: req.body.salary,
                }
            )
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Instructor updated successfully',
            })
        })

        it('should return an error if instructorId is not provided', async () => {
            const req: any = mockRequest({}, {})
            const res = mockResponse()

            await InstructorController.updateInstructor(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'instructorId is required',
            })
        })

        it('should return an error if instructor is not found', async () => {
            const req: any = mockRequest(
                {
                    name: 'Jane Doe',
                    phone: '9876543210',
                    department: 'Physics',
                    salary: 60000,
                },
                { instructorId: '12345' }
            )
            const res = mockResponse()

            mockMatchedData(req.body)
            ;(Instructor.findByIdAndUpdate as jest.Mock).mockResolvedValue(null)
            ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

            await InstructorController.updateInstructor(req, res)

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Instructor not found',
            })
            expect(res.status).toHaveBeenCalledWith(404)
        })

        it('should return an error if course validation fails', async () => {
            const req: any = mockRequest(
                {
                    courses: ['invalidCourseId'],
                },
                { instructorId: '12345' }
            )
            const res = mockResponse()
            mockMatchedData(req.body)
            ;(Course.find as jest.Mock).mockResolvedValue([])

            await InstructorController.updateInstructor(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'One or more courses provided are invalid',
            })
        })
    })

    describe('delete an Instructor', () => {
        it('should delete the instructor and associated user successfully', async () => {
            const req: any = mockRequest({}, { instructorId: '12345' })
            const res = mockResponse()

            ;(Instructor.findByIdAndDelete as jest.Mock).mockResolvedValue({
                user: 'userId',
            })
            ;(User.findByIdAndDelete as jest.Mock).mockResolvedValue({})

            await InstructorController.deleteInstructor(req, res)

            expect(Instructor.findByIdAndDelete).toHaveBeenCalledWith(
                req.params.instructorId
            )
            expect(User.findByIdAndDelete).toHaveBeenCalledWith('userId')
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Instructor deleted successfully',
            })
        })

        it('should return an error if instructorId is not provided', async () => {
            const req: any = mockRequest({}, {})
            const res = mockResponse()

            await InstructorController.deleteInstructor(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'instructorId is required',
            })
        })

        it('should return an error if instructor is not found', async () => {
            const req: any = mockRequest({}, { instructorId: '12345' })
            const res = mockResponse()

            ;(Instructor.findByIdAndDelete as jest.Mock).mockResolvedValue(null)

            await InstructorController.deleteInstructor(req, res)

            expect(Instructor.findByIdAndDelete).toHaveBeenCalledWith(
                req.params.instructorId
            )
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Instructor not found',
            })
        })
    })
})
