import SortCourseAndStudentController from '../../controllers/sort'
import { quickSort, mergeSort } from '../../utils/sortingTechniques'
import { getOrSetCache } from '../../utils/cache'

jest.mock('../../models/Course')
jest.mock('../../models/Student')
jest.mock('../../utils/cache')
jest.mock('../../utils/sortingTechniques')

describe('SortCourseAndStudentController', () => {
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
    describe('sortCourses', () => {
        it('should return 400 if no sortBy parameter is provided', async () => {
            const req: any = mockRequest()
            const res = mockResponse()
            await SortCourseAndStudentController.sortCourses(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Sort parameter is required.',
            })
        })

        it('should return 404 if no courses are found', async () => {
            const req: any = mockRequest({}, {}, {}, { sortBy: 'name' })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockResolvedValue([])
            await SortCourseAndStudentController.sortCourses(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No courses found.',
            })
        })

        it('should return sorted courses with pagination', async () => {
            const req: any = mockRequest(
                {},
                {},
                {},
                { sortBy: 'name', order: 'asc', page: '1', limit: '10' }
            )
            const res = mockResponse()
            const mockCourses = [
                {
                    name: 'Math',
                    code: 'MATH101',
                    credits: 3,
                    semester: 'Spring',
                    department: 'Science',
                },
                {
                    name: 'English',
                    code: 'ENG101',
                    credits: 3,
                    semester: 'Fall',
                    department: 'Arts',
                },
            ]

            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockCourses)
            ;(quickSort as jest.Mock).mockImplementation(
                (courses: any, compareFn: any) => courses.sort(compareFn)
            )

            await SortCourseAndStudentController.sortCourses(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                page: 1,
                limit: 10,
                data: mockCourses,
            })
        })

        it('should return 500 if an error occurs during course fetching', async () => {
            const req: any = mockRequest({}, {}, {}, { sortBy: 'name' })
            const res = mockResponse()
            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Internal error')
            )
            await SortCourseAndStudentController.sortCourses(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Internal server error.',
            })
        })
    })

    describe('sort Students', () => {
        it('should return 400 if no sortBy parameter is provided', async () => {
            const req: any = mockRequest()
            const res = mockResponse()
            await SortCourseAndStudentController.sortStudents(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Sort parameter is required.',
            })
        })

        it('should return 404 if no students are found', async () => {
            const req: any = mockRequest({}, {}, {}, { sortBy: 'name' })
            const res = mockResponse()
            ;(getOrSetCache as jest.Mock).mockResolvedValue([])
            await SortCourseAndStudentController.sortStudents(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No students found.',
            })
        })

        it('should return sorted students with pagination', async () => {
            const req: any = mockRequest(
                {},
                {},
                {},
                { sortBy: 'name', order: 'asc', page: '1', limit: '10' }
            )
            const res = mockResponse()
            const mockStudents = [
                {
                    name: 'John Doe',
                    level: 1,
                    cgpa: 3.5,
                    gender: 'Male',
                    address: '123 Street',
                },
                {
                    name: 'Jane Doe',
                    level: 2,
                    cgpa: 3.8,
                    gender: 'Female',
                    address: '456 Avenue',
                },
            ]

            ;(getOrSetCache as jest.Mock).mockResolvedValue(mockStudents)
            ;(mergeSort as jest.Mock).mockImplementation(
                (students: any, compareFn: any) => students.sort(compareFn)
            )

            await SortCourseAndStudentController.sortStudents(req, res)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                page: 1,
                limit: 10,
                data: mockStudents,
            })
        })

        it('should return 500 if an error occurs during student fetching', async () => {
            const req: any = mockRequest({}, {}, {}, { sortBy: 'name' })
            const res = mockResponse()

            ;(getOrSetCache as jest.Mock).mockRejectedValue(
                new Error('Internal error')
            )
            await SortCourseAndStudentController.sortStudents(req, res)
            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Internal server error.',
            })
        })
    })
})
