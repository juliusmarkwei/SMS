import EnrollmentController from '../../controllers/enrollments'
import Enrollment from '../../models/Enrollment'
import Student from '../../models/Student'
import Course from '../../models/Course'
import { Role } from '../../utils/enums'
import { getOrSetCache } from '../../utils/cache'

jest.mock('../../models/Enrollment')
jest.mock('../../models/Student')
jest.mock('../../models/Course')
jest.mock('../../utils/cache')
jest.mock('../../utils/logger')

describe('Enrollment Controller', () => {
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

    describe('enroll student in a Course', () => {
        it('should return 400 if studentId or courseCode is missing', async () => {
            const req: any = mockRequest({ studentId: '', courseCode: '' })
            const res: any = mockResponse()

            await EnrollmentController.enrollStudentInCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                message: 'studentId and courseCode are required',
                success: false,
            })
        })

        it('should return 401 if user is not authorized to enroll another student', async () => {
            const req: any = {
                body: { studentId: 'S001', courseCode: 'C001' },
                user: { id: 'user001', role: Role.STUDENT },
            }
            const res: any = mockResponse()

            Student.findOne = jest.fn().mockResolvedValue(null) // Student not found

            await EnrollmentController.enrollStudentInCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'You are not authorized to enroll another student',
            })
        })

        it('should return 404 if course is not found', async () => {
            const req: any = mockRequest(
                { studentId: 'S001', courseCode: 'C001' },
                {},
                { id: 'user001', role: Role.INSTRUCTOR }
            )
            const res: any = mockResponse()

            Course.findOne = jest
                .fn()
                .mockResolvedValue({ select: jest.fn((id: any) => null) }) // Course not found

            await EnrollmentController.enrollStudentInCourse(req, res)

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Course with code C001 not found',
            })
            expect(res.status).toHaveBeenCalledWith(404)
        })

        it('should return 201 when student is successfully enrolled', async () => {
            const req: any = mockRequest(
                { studentId: 'S001', courseCode: 'C001' },
                {},
                { id: 'user001', role: Role.INSTRUCTOR }
            )
            const res: any = mockResponse()

            const mockCourse = { _id: 'courseId' }

            Course.findOne = jest
                .fn()
                .mockResolvedValue({ select: jest.fn((id: any) => mockCourse) })
            Enrollment.prototype.save = jest.fn().mockResolvedValue(null)
            Student.findByIdAndUpdate = jest.fn().mockResolvedValue({
                courses: ['C001'],
                cgpa: 3.5,
                level: 300,
            })

            await EnrollmentController.enrollStudentInCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Student enrolled successfully!',
            })
        })

        it('should return 400 if student is already enrolled in course', async () => {
            const req: any = {
                body: { studentId: 'S001', courseCode: 'C001' },
                user: { id: 'user001', role: Role.INSTRUCTOR },
            }
            const res: any = mockResponse()

            const mockCourse = { _id: 'courseId' }

            Course.findOne = jest
                .fn()
                .mockResolvedValue({ select: jest.fn((id: any) => mockCourse) })
            Enrollment.prototype.save = jest
                .fn()
                .mockRejectedValue({ code: 11000 }) // Unique constraint error

            await EnrollmentController.enrollStudentInCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Student is already enrolled in course C001',
            })
        })

        it('should return 500 on server error', async () => {
            const req: any = {
                body: { studentId: 'S001', courseCode: 'C001' },
                user: { id: 'user001', role: Role.INSTRUCTOR },
            }
            const res: any = mockResponse()

            const mockCourse = { _id: 'courseId' }

            Course.findOne = jest.fn().mockResolvedValue(mockCourse)
            Enrollment.prototype.save = jest
                .fn()
                .mockRejectedValue(new Error('Internal error'))

            await EnrollmentController.enrollStudentInCourse(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error',
            })
        })
    })

    describe('fetch all Courses for a Student', () => {
        it('should return 400 if studentId is missing', async () => {
            const req: any = { params: {} }
            const res: any = mockResponse()

            await EnrollmentController.getAllCoursesForAStudent(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Student ID is required',
                success: false,
            })
        })

        it('should return 404 if no courses found', async () => {
            const req: any = mockRequest(
                {},
                { studentId: 'S001' },
                {},
                { id: 'user001', role: Role.INSTRUCTOR }
            )
            const res: any = mockResponse()
            ;(getOrSetCache as jest.Mock).mockResolvedValue(null) // No courses in cache or DB

            await EnrollmentController.getAllCoursesForAStudent(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No courses found for this student',
            })
        })

        it("should return 200 and the student's courses", async () => {
            const req: any = {
                params: { studentId: 'S001' },
                user: { id: 'user001', role: Role.INSTRUCTOR },
            }
            const res: any = mockResponse()

            const mockCourses: any = [{ _id: 'courseId', name: 'Course 1' }]

            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockCourses) // Mocking courses in cache

            await EnrollmentController.getAllCoursesForAStudent(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                courses: mockCourses,
            })
        })

        it('should return 500 on error', async () => {
            const req: any = {
                params: { studentId: 'S001' },
                user: { id: 'user001', role: Role.INSTRUCTOR },
            }
            const res: any = mockResponse()

            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Internal error')
            )

            await EnrollmentController.getAllCoursesForAStudent(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal error',
            })
        })
    })

    describe('delete an Enrollment', () => {
        it('should return 400 if enrollmentId is missing', async () => {
            const req: any = { params: {} }
            const res: any = mockResponse()

            await EnrollmentController.deleteEnrollment(req, res)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'enrollmentId is required',
            })
        })

        it('should return 404 if enrollment is not found', async () => {
            const req: any = mockRequest(
                {},
                { enrollmentId: 'E001' },
                { id: 'user001', role: Role.INSTRUCTOR }
            )
            const res: any = mockResponse()

            Student.findOne = jest.fn().mockResolvedValue({
                select: jest.fn((id: any) => ({ id, name: 'John Doe' })),
            })
            Enrollment.findOneAndDelete = jest.fn().mockResolvedValue(null) // Enrollment not found
            // Student.findByIdAndUpdate = jest.fn().mockResolvedValue(null)

            await EnrollmentController.deleteEnrollment(req, res)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Enrollment not found!',
            })
        })

        it('should return 200 when enrollment is successfully deleted', async () => {
            const req: any = mockRequest(
                {},
                { enrollmentId: 'E001' },
                { id: 'user001', role: Role.STUDENT }
            )
            const res: any = mockResponse()

            const mockEnrollment = { student: 'S001', course: 'C001' }
            Student.findOne = jest.fn().mockResolvedValue({
                select: jest.fn((id: any) => ({ id, name: 'John Doe' })),
            })
            Enrollment.findOneAndDelete = jest
                .fn()
                .mockResolvedValue(mockEnrollment)
            Student.findByIdAndUpdate = jest.fn().mockResolvedValue(null)

            await EnrollmentController.deleteEnrollment(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Enrollment deleted successfully',
            })
        })

        it('should return 500 on error', async () => {
            const req: any = {
                params: { enrollmentId: 'E001' },
                user: { id: 'user001', role: Role.STUDENT },
            }
            const res: any = mockResponse()

            Enrollment.findOneAndDelete = jest
                .fn()
                .mockRejectedValue(new Error('Internal error'))

            await EnrollmentController.deleteEnrollment(req, res)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error',
            })
        })
    })
})
