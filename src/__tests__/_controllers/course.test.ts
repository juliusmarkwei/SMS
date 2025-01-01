import CourseController from '../../controllers/courses'
import Course from '../../models/Course'
import { getOrSetCache } from '../../utils/cache'

jest.mock('../../models/Course')
jest.mock('../../utils/logger')
jest.mock('../../utils/cache')

describe('Course Controller', () => {
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

    describe('fetch all Courses', () => {
        it('should return a list of courses with pagination', async () => {
            const req: any = mockRequest(
                {},
                {},
                {},
                { page: 1, limit: 10, department: 'Computer Science' }
            )
            const res = mockResponse()

            const mockCourses = [
                { name: 'Course 1', code: 'C001' },
                { name: 'Course 2', code: 'C002' },
            ]

            const mockTotalCourses = 2
            const mockCountDocuments: any = mockTotalCourses
            const mockCache = jest.fn().mockResolvedValue(mockCourses)

            ;(getOrSetCache as jest.Mock).mockImplementation(mockCache)
            ;(Course.countDocuments as jest.Mock).mockImplementation(
                () => mockCountDocuments
            )

            await CourseController.getAllCourses(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                page: 1,
                limit: 10,
                totalCourses: mockTotalCourses,
                totalPages: 1,
                courses: mockCourses,
            })
        })

        it('should return a 404 if no courses are found', async () => {
            const req: any = mockRequest({ page: 1, limit: 10 })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockImplementation(async () => [])
            ;(Course.countDocuments as jest.Mock).mockImplementation(() => 0)

            await CourseController.getAllCourses(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No courses found',
            })
        })

        it('should return a 500 if there is a server error', async () => {
            const req: any = mockRequest({ page: 1, limit: 10 })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await CourseController.getAllCourses(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error',
            })
        })
    })

    describe('fetch a Course', () => {
        it('should return a course by course code', async () => {
            const req: any = mockRequest({}, { courseCode: 'C001' })
            const res = mockResponse()

            const mockCourse = { name: 'Course 1', code: 'C001' }

            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockCourse)

            await CourseController.getCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                course: mockCourse,
            })
        })

        it('should return 404 if course not found', async () => {
            const req: any = mockRequest({}, { courseCode: 'C001' })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockResolvedValue(null)

            await CourseController.getCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course with code C001 not found',
                success: false,
            })
        })

        it('should return 500 on server error', async () => {
            const req: any = mockRequest({}, { courseCode: 'C001' })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await CourseController.getCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                success: false,
            })
        })
    })

    describe('create a Course', () => {
        it('should create a new course', async () => {
            const req: any = mockRequest(
                {
                    name: 'New Course',
                    code: 'C003',
                    description: 'Course description',
                    credits: 3,
                    semester: 'Spring',
                    department: 'Computer Science',
                },
                {}
            )
            const res = mockResponse()

            const mockSave = jest.fn().mockResolvedValue({})

            Course.prototype.save = mockSave

            await CourseController.createCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Course created successfully!',
            })
        })

        it('should return 400 for validation errors', async () => {
            const req: any = mockRequest({}, {})
            const res = mockResponse()

            const mockError = {
                code: 11000,
                keyPattern: { code: 1 },
                keyValue: { code: 'C001' },
            }
            const mockSave = jest.fn().mockRejectedValue(mockError)

            Course.prototype.save = mockSave

            await CourseController.createCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: `A course with the same code (C001) already exists.`,
            })
        })

        it('should return 500 if there is a server error', async () => {
            const req: any = mockRequest(
                {
                    name: 'New Course',
                    code: 'C003',
                    description: 'Course description',
                    credits: 3,
                    semester: 'Spring',
                    department: 'Computer Science',
                },
                {}
            )
            const res = mockResponse()

            const mockSave = jest
                .fn()
                .mockRejectedValue(new Error('Database error'))

            Course.prototype.save = mockSave

            await CourseController.createCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error',
            })
        })
    })

    describe('update a Course', () => {
        it('should update an existing course', async () => {
            const req: any = mockRequest(
                { name: 'Updated Course', code: 'C003', credits: 4 },
                { courseCode: 'C003' }
            )
            const res = mockResponse()

            const mockCourse = { name: 'Updated Course', code: 'C003' }
            const mockUpdate = jest.fn().mockResolvedValue(mockCourse)

            Course.findOneAndUpdate = mockUpdate

            await CourseController.updateCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course updated successfully!',
                success: true,
            })
        })

        it('should return 404 if course is not found', async () => {
            const req: any = mockRequest(
                { name: 'Updated Course', code: 'C003', credits: 4 },
                { courseCode: 'C003' }
            )
            const res = mockResponse()

            const mockUpdate = jest.fn().mockResolvedValue(null)

            Course.findOneAndUpdate = mockUpdate

            await CourseController.updateCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course with code C003 not found',
                success: false,
            })
        })

        it('should return 500 if there is a server error', async () => {
            const req: any = mockRequest(
                { name: 'Updated Course', code: 'C003', credits: 4 },
                { courseCode: 'C003' }
            )
            const res = mockResponse()

            const mockUpdate = jest
                .fn()
                .mockRejectedValue(new Error('Database error'))

            Course.findOneAndUpdate = mockUpdate

            await CourseController.updateCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                success: false,
            })
        })
    })

    describe('delete a Course', () => {
        it('should delete a course', async () => {
            const req: any = mockRequest({}, { courseCode: 'C003' })
            const res = mockResponse()

            const mockDelete = jest.fn().mockResolvedValue({})

            Course.findOneAndDelete = mockDelete

            await CourseController.deleteCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Course deleted successfully!',
            })
        })

        it('should return 404 if course not found', async () => {
            const req: any = mockRequest({}, { courseCode: 'C003' })
            const res = mockResponse()

            const mockDelete = jest.fn().mockResolvedValue(null)

            Course.findOneAndDelete = mockDelete

            await CourseController.deleteCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Course with code C003 not found',
                success: false,
            })
        })

        it('should return 500 if there is a server error', async () => {
            const req: any = mockRequest({}, { courseCode: 'C003' })
            const res = mockResponse()

            const mockDelete = jest
                .fn()
                .mockRejectedValue(new Error('Database error'))

            Course.findOneAndDelete = mockDelete

            await CourseController.deleteCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                success: false,
            })
        })
    })
})
