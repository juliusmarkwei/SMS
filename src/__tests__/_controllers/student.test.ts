import 'dotenv/config'
import { requestBodyErrorsInterrupt } from '../../utils/middleware/handleReqBodyErrors'
import StudentController from '../../controllers/students'
import { newStudent1 } from '../../test_data/user.data'
import { matchedData, validationResult } from 'express-validator'
import User from '../../models/User'
import Student from '../../models/Student'
import bcrypt from 'bcrypt'
import { getOrSetCache } from '../../utils/cache'

// mock dependencies
jest.mock('express-validator', () => ({
    validationResult: jest.fn(),
    matchedData: jest.fn((req) => req.body),
}))
jest.mock('../../utils/middleware/handleReqBodyErrors', () => ({
    requestBodyErrorsInterrupt: jest.fn(),
}))
jest.mock('../../utils/mailer', () => ({
    emailNewUsers: jest.fn(),
}))

jest.mock('bcrypt')
jest.mock('../../models/User.ts')
jest.mock('../../models/Student.ts')
jest.mock('../../utils/cache')

const mockRequest: { [key: string]: any } | any = {}

const mockResponse: { [key: string]: any } | any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
}

describe('Student Controller', () => {
    // setups and cleanups
    beforeEach(() => {
        mockRequest.body = {}
        mockRequest.params = {}
        mockRequest.query = {}
        mockRequest.json = jest.fn()
        mockResponse.status = jest.fn().mockReturnThis()
        mockResponse.json = jest.fn()
        jest.clearAllMocks()
    })

    describe('create user or student-specific', () => {
        it('should return a status of 400 when body is empty', async () => {
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
            ;(requestBodyErrorsInterrupt as jest.Mock).mockImplementation(
                (req, res) => {
                    const errors = validationResult(req)
                    if (!errors.isEmpty()) {
                        res.status(400).json({
                            success: false,
                            error: errors.array(),
                        })
                        return true
                    }
                    return false
                }
            )

            await StudentController.createStudent(mockRequest, mockResponse)
            expect(requestBodyErrorsInterrupt).toHaveBeenCalled()
            expect(requestBodyErrorsInterrupt).toHaveBeenCalledTimes(1)
            expect(requestBodyErrorsInterrupt).toHaveBeenCalledWith(
                mockRequest,
                mockResponse
            )
            expect(requestBodyErrorsInterrupt).toHaveLastReturnedWith(true)
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledTimes(1)
            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledTimes(1)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: [
                    {
                        msg: 'Invalid value',
                        location: 'body',
                        param: 'name',
                    },
                ],
            })
        })

        it('should return a status of 400 when request body is incomplete', async () => {
            mockRequest.body = {
                name: 'John Doe',
                password: 'p@$$wOrd123',
                email: 'johndoe@example.com',
                phone: '1234567890',
                address: '123 Main St', // still missing some fields
            }
            await StudentController.createStudent(mockRequest, mockResponse)
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: [
                    {
                        msg: 'Invalid value',
                        location: 'body',
                        param: 'name',
                    },
                ],
            })
        })

        it('should create a user when request body is complete', async () => {
            mockRequest.body = newStudent1 // complete body
            ;(validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([]),
            })

            jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => {
                return 'salt'
            })

            jest.spyOn(bcrypt, 'hash').mockImplementation((password) => {
                return `hashed_${password}`
            })

            await StudentController.createStudent(mockRequest, mockResponse)

            expect(matchedData).toHaveBeenCalled()
            expect(matchedData).toHaveBeenCalledTimes(1)
            expect(matchedData).toHaveBeenCalledWith(mockRequest)
            expect(matchedData).toHaveLastReturnedWith(newStudent1)
            expect(User.findOne).toHaveBeenCalled()
            expect(User.findOne).toHaveBeenCalledTimes(1)
            expect(User.findOne).toHaveBeenCalledWith({
                email: newStudent1.email,
            })
            expect(bcrypt.genSalt).toHaveBeenCalled()
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10)
            expect(bcrypt.hash).toHaveBeenCalled()
            expect(bcrypt.hash).toHaveBeenCalledWith(
                newStudent1.password,
                'salt'
            )
            expect(bcrypt.hash).toHaveLastReturnedWith('hashed_p@$$wOrd123')
            expect(User).toHaveBeenCalled()
            expect(User).toHaveBeenCalledWith({
                ...newStudent1,
                role: 'student',
                password: 'hashed_p@$$wOrd123',
                cgpa: undefined,
                level: undefined, // omiting level and cgpa
            })
            expect(User.prototype.save).toHaveBeenCalled()
            expect(User.prototype.save).toHaveBeenCalledTimes(1)
        })

        it('should create a student when request body is complete', async () => {
            mockRequest.body = newStudent1
            const save = jest.fn()

            jest.spyOn(User.prototype, 'save').mockImplementation(() => {
                save()
                return { _id: 1 }
            })

            await StudentController.createStudent(mockRequest, mockResponse)
            expect(User).toHaveBeenCalled()
            expect(User.prototype.save).toHaveBeenCalled()
            expect(User.prototype.save).toHaveLastReturnedWith({ _id: 1 })
            expect(Student).toHaveBeenCalled()
            expect(Student.prototype.save).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(201)
            expect(mockResponse.json).toHaveBeenCalled()
        })

        it('should return status 500 when an error occur saving user/student', async () => {
            mockRequest.body = newStudent1
            const save = jest.fn()

            jest.spyOn(User.prototype, 'save').mockImplementation(() => {
                save()
                throw new Error('Internal server error.')
            })

            await StudentController.createStudent(mockRequest, mockResponse)
            expect(User).toHaveBeenCalled()
            expect(User.prototype.save).toHaveBeenCalled()
            expect(User.prototype.save).not.toHaveLastReturnedWith(1)
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(500)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Internal server error.',
            })
        })
    })

    describe('fetch a student', () => {
        const mockRequest: { [key: string]: any } | any = {
            params: {
                studentId: 1,
            },
            user: {
                id: 1,
                role: 'instructor',
            },
        }
        const mockResponse: { [key: string]: any } | any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        it('should return 200 when student is found', async () => {
            Student.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                toObject: jest.fn().mockReturnValue({
                    _id: 1,
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    phone: '1234567890',
                    address: '123 Main St',
                    level: '100',
                    cgpa: '4.0',
                    user: {
                        name: 'John Doe',
                        email: 'johndoe@example.com',
                        phone: '1234567890',
                    },
                }),
            })

            // Mock getOrSetCache
            ;(getOrSetCache as jest.Mock).mockImplementation(
                async (cacheKey, callback) => {
                    return callback()
                }
            )

            await StudentController.getSingleStudent(mockRequest, mockResponse)
            expect(getOrSetCache).toHaveBeenCalled()
            expect(getOrSetCache).toHaveBeenCalledWith(
                `student:studId=1&user=1`,
                expect.any(Function)
            )
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                student: {
                    _id: 1,
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    phone: '1234567890',
                    address: '123 Main St',
                    level: '100',
                    cgpa: '4.0',
                },
            })
        })

        it('should return 400 bad request when studentId is not provided', async () => {
            const req: any = {
                params: {},
            }
            await StudentController.getSingleStudent(req, mockResponse)
            expect(req.params).toEqual({})
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'studentId not provided or is invalid',
            })
        })

        it('should return 404 when student is not found', async () => {
            Student.findOne = jest.fn().mockReturnValue(null)

            // Mock getOrSetCache
            ;(getOrSetCache as jest.Mock).mockImplementation(
                async (cacheKey, callback) => {
                    return callback()
                }
            )
            await StudentController.getSingleStudent(mockRequest, mockResponse)
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Student not found',
            })
        })

        it('should return 404 if user is not an instructor and fetching another student', async () => {
            const req: any = {
                params: {
                    studentId: 2,
                },
                user: {
                    id: 1,
                    role: 'student',
                },
            }
            Student.findOne = jest.fn().mockReturnValue(null)

            // Mock getOrSetCache
            ;(getOrSetCache as jest.Mock).mockImplementation(
                async (cacheKey, callback) => {
                    return callback()
                }
            )
            await StudentController.getSingleStudent(req, mockResponse)
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(404)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: "You are not authorized to view this student's information",
            })
        })
    })

    describe('update a student info', () => {
        StudentController.getStudentById = jest.fn(() => {
            return Promise.resolve({
                _id: 1,
                name: 'John Doe',
                email: 'johndoe@example.com',
                phone: '1234567890',
                address: '123 Main St',
                level: '100',
                cgpa: '4.0',
                user: {
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    phone: '1234567890',
                },
            })
        })

        it('should return 400 when studentId is not provided', async () => {
            ;(mockRequest.params = {}),
                await StudentController.updateSingleStudent(
                    mockRequest,
                    mockResponse
                )
            expect(mockRequest.params).toEqual({})
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(400)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Student ID is required',
            })
        })

        it('should validate request body', async () => {
            ;(validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([]),
            })

            mockRequest.params = {
                studentId: 1,
            }
            mockRequest.body = {
                name: 'Russell Gross', // some basic data to update
                address: '1926 Wurcuc Lane',
            }

            await StudentController.updateSingleStudent(
                mockRequest,
                mockResponse
            )
            expect(requestBodyErrorsInterrupt).toHaveBeenCalled()
            expect(requestBodyErrorsInterrupt).toHaveLastReturnedWith(false)
            expect(matchedData).toHaveBeenCalled()
            expect(matchedData).toHaveLastReturnedWith({
                name: 'Russell Gross',
                address: '1926 Wurcuc Lane',
            })
        })

        it('should fetch student to be updated, assuming user is student', async () => {
            mockRequest.params = {
                studentId: 1,
            }
            mockRequest.body = {
                name: 'Russell Gross', // some basic data to update
                address: '1926 Wurcuc Lane',
            }
            mockRequest.user = {
                id: 1,
                role: 'student',
            }

            await StudentController.updateSingleStudent(
                mockRequest,
                mockResponse
            )
            expect(StudentController.getStudentById).toHaveBeenCalled()
            expect(StudentController.getStudentById).toHaveBeenCalledWith(1)
            expect(StudentController.getStudentById).toHaveBeenCalledTimes(1)

            const studentData = await StudentController.getStudentById(1)
            expect(studentData).toEqual({
                _id: 1,
                name: 'John Doe',
                email: 'johndoe@example.com',
                phone: '1234567890',
                address: '123 Main St',
                level: '100',
                cgpa: '4.0',
                user: {
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    phone: '1234567890',
                },
            })
        })

        it('should return 200 when student is updated successfully, assuming user is studen', async () => {
            mockRequest.params = {
                studentId: 1,
            }
            mockRequest.body = {
                name: 'Russell Gross', // some basic data to update
                address: '1926 Wurcuc Lane',
            }
            mockRequest.user = {
                id: 1,
                role: 'student',
            }

            jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
                name: 'Russell Gross',
                address: '1926 Wurcuc Lane',
            } as any)

            await StudentController.updateSingleStudent(
                mockRequest,
                mockResponse
            )

            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Student updated successfully',
            })
        })

        it('should return 200 when student is updated successfully, assuming instructor is studen', async () => {
            mockRequest.params = {
                studentId: 1,
            }
            mockRequest.body = {
                name: 'Johanna Carlson', // some basic data to update
                address: '1534 Ficoz Loop',
            }
            mockRequest.user = {
                id: 5,
                role: 'instructor',
            }

            jest.spyOn(Student, 'findByIdAndUpdate').mockReturnValue({
                name: 'Johanna Carlson',
                address: '1534 Ficoz Loop',
            } as any)

            jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
                name: 'Johanna Carlson',
                address: '1534 Ficoz Loop',
            } as any)

            await StudentController.updateSingleStudent(
                mockRequest,
                mockResponse
            )

            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Student updated successfully',
            })
        })
    })

    describe('fetch all students', () => {
        mockRequest.query = {
            page: '1',
            limit: '10',
        }

        it('should return 200 with paginated student data', async () => {
            // Mock getOrSetCache
            ;(getOrSetCache as jest.Mock).mockImplementation(
                async (cacheKey, callback) => {
                    return callback()
                }
            )

            // Mock Student.find
            jest.spyOn(Student, 'find').mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    {
                        toObject: jest.fn().mockReturnValue({
                            _id: 1,
                            level: '100',
                            cgpa: '4.0',
                            courses: ['Math', 'Science'],
                            user: {
                                name: 'John Doe',
                                email: 'johndoe@example.com',
                                phone: '1234567890',
                                gender: 'male',
                            },
                        }),
                    },
                    {
                        toObject: jest.fn().mockReturnValue({
                            _id: 2,
                            level: '200',
                            cgpa: '3.8',
                            courses: ['English', 'History'],
                            user: {
                                name: 'Jane Smith',
                                email: 'janesmith@example.com',
                                phone: '9876543210',
                                gender: 'female',
                            },
                        }),
                    },
                ]),
            } as any)

            // Mock Student.countDocuments
            jest.spyOn(Student, 'countDocuments').mockResolvedValue(2)

            // Call the controller
            await StudentController.getAllStudents(mockRequest, mockResponse)

            // Assertions
            expect(Student.find).toHaveBeenCalled()
            expect(Student.find).toHaveBeenCalledWith({})
            expect(Student.countDocuments).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                currentPage: 1,
                totalPages: 1,
                count: 2,
                size: 10,
                data: [
                    {
                        _id: 1,
                        level: '100',
                        cgpa: '4.0',
                        name: 'John Doe',
                        gender: 'male',
                        email: 'johndoe@example.com',
                        phone: '1234567890',
                        courses: ['Math', 'Science'],
                    },
                    {
                        _id: 2,
                        level: '200',
                        cgpa: '3.8',
                        name: 'Jane Smith',
                        gender: 'female',
                        email: 'janesmith@example.com',
                        phone: '9876543210',
                        courses: ['English', 'History'],
                    },
                ],
            })
        })
    })

    describe('delete a student', () => {
        it('should return 200 when user is deleted', async () => {
            mockRequest.params = {
                studentId: 1,
            }

            jest.spyOn(Student, 'findByIdAndDelete').mockReturnValueOnce({
                _id: 1,
                level: '100',
                cgpa: '4.0',
                user: 3, // assuming this is the userId on the student
            } as any)

            jest.spyOn(User, 'findByIdAndDelete').mockReturnValueOnce({
                name: 'John Doe',
                email: 'johndoe@example.com',
                phone: '1234567890',
            } as any)

            await StudentController.deleteStudent(mockRequest, mockResponse)

            expect(Student.findByIdAndDelete).toHaveBeenCalled()
            expect(Student.findByIdAndDelete).toHaveBeenCalledWith(1)
            expect(Student.findByIdAndDelete).toHaveBeenCalledTimes(1)
            expect(Student.findByIdAndDelete).toHaveLastReturnedWith({
                _id: 1,
                level: '100',
                cgpa: '4.0',
                user: 3,
            })
            expect(User.findByIdAndDelete).toHaveBeenCalled()
            expect(User.findByIdAndDelete).toHaveBeenCalledWith(3)
            expect(mockResponse.status).toHaveBeenCalled()
            expect(mockResponse.status).toHaveBeenCalledWith(200)
            expect(mockResponse.json).toHaveBeenCalled()
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Student deleted successfully',
            })
        })
    })
})
