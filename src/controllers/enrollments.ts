import { Response, Request } from 'express'
import Enrollment from '../models/Enrollment'
import { logger } from '../utils/logger'
import { getOrSetCache } from '../utils/cache'
import Student from '../models/Student'
import Course from '../models/Course'
import { Role } from '../utils/enums'
import { ICourse } from '../utils/types/course'
import { IStudent } from '../utils/types/student'

class EnrollmentController {
    static async enrollStudentInCourse(req: Request, res: Response) {
        const { studentId, courseCode } = req.body
        if (!studentId || !courseCode) {
            res.status(400).json({
                message: 'studentId and courseCode are required',
                success: false,
            })
            return
        }
        const { id, role } = req.user as { [key: string]: string }
        const isInstructor = role === Role.INSTRUCTOR
        if (!isInstructor) {
            // check if student is enrolling themselves, else deny access
            const student: IStudent | null = await Student.findOne({
                user: id,
                _id: studentId,
            })

            if (!student) {
                res.status(401).json({
                    success: false,
                    message: 'You are not authorized to enroll another student',
                })
                return
            }
        }

        try {
            const course: ICourse | null = await Course.findOne({
                code: courseCode,
            })
            if (!course) {
                res.status(404).json({
                    success: false,
                    message: `Course with code ${courseCode} not found`,
                })
                return
            }

            const enrollment = new Enrollment({
                student: studentId,
                course: course._id,
            })
            await enrollment.save()

            // add courseId to courses for the student
            await Student.findByIdAndUpdate(studentId, {
                $push: { courses: course._id },
            })

            res.status(201).json({
                success: true,
                message: 'Student enrolled successfully!',
            })
        } catch (error: any) {
            logger.error(error)

            // handle mongoose error (unique constraint)
            if (error.code === 11000) {
                res.status(400).json({
                    success: false,
                    message: `Student is already enrolled in course ${courseCode}`,
                })
                return
            }

            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(
                    (err: any) => err.message
                )
                res.status(400).json({
                    success: false,
                    message: validationErrors.join(', '),
                })
                return
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            })
        }
    }

    static async getAllCoursesForAStudent(req: Request, res: Response) {
        const { studentId } = req.params

        // Validate studentId
        if (!studentId) {
            res.status(400).json({
                message: 'Student ID is required',
                success: false,
            })
            return
        }

        try {
            const { id, role } = req.user as { [key: string]: string }
            const isInstructor = role === Role.INSTRUCTOR

            // Restrict students to only view their own courses
            const query: any = { _id: studentId }
            if (!isInstructor) {
                query.user = id
            }

            logger.info(query)

            const cacheKey = isInstructor
                ? `enrollments:studentId=${studentId}`
                : `enrollments:studentId=${studentId}&user=${id}`

            const courses = await getOrSetCache(cacheKey, async () => {
                // Fetch the student and populate courses
                const studentCourses: IStudent[] | null = await Student.find(
                    query
                )
                    .populate('courses', '-__v')
                    .select('courses')

                if (!studentCourses || studentCourses.length === 0) {
                    return null
                }
                logger.info('Fetched Courses:', studentCourses)

                // Return the courses array
                return studentCourses[0].courses
            })

            if (!courses) {
                res.status(404).json({
                    success: false,
                    message: 'No courses found for this student',
                })
                return
            }

            res.status(200).json({
                success: true,
                courses,
            })
        } catch (error: any) {
            logger.error(error.message)
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            })
        }
    }

    static async getAllStudentsForACourse(req: Request, res: Response) {
        const { courseCode } = req.params

        if (!courseCode) {
            res.status(400).json({
                message: 'Course code is required',
                success: false,
            })
            return
        }

        try {
            const cacheKey = `enrollments:courseCode=${courseCode}`

            const students = await getOrSetCache(cacheKey, async () => {
                const course: ICourse | null = await Course.findOne({
                    code: courseCode,
                }).select('_id')

                if (!course) {
                    throw new Error(`Course with code ${courseCode} not found`)
                }

                const results: IStudent[] | null = await Student.find({
                    courses: course._id,
                })
                    .populate('user', 'name email phone -_id')
                    .select('-__v -createdAt -updatedAt -courses')

                const foramattedResults = results.map((student: any) => {
                    const { user, ...rest } = student.toObject()
                    return {
                        ...rest,
                        ...user,
                    }
                })
                return foramattedResults
            })

            res.status(200).json({ success: true, students })
        } catch (error: any) {
            logger.error(error.message || error)
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            })
        }
    }

    static async deleteEnrollment(req: Request, res: Response) {
        const { enrollmentId } = req.params

        if (!enrollmentId) {
            res.status(400).json({
                success: false,
                message: 'enrollmentId is required',
            })
            return
        }

        // Build query to restrict students from deleting other enrollments
        const { id, role } = req.user as { [key: string]: string }
        const isInstructor = role === Role.INSTRUCTOR

        try {
            const enrollmentQuery: any = { _id: enrollmentId }

            if (!isInstructor) {
                // Get the student's _id
                const student = await Student.findOne({
                    user: id,
                })
                if (!student) {
                    res.status(401).json({
                        success: false,
                        message: 'Unauthorized: Student not found',
                    })
                    return
                }

                // Restrict deletion to the student's enrollment only
                enrollmentQuery.student = student._id
            }

            // Delete the enrollment
            const deletedEnrollment: any = await Enrollment.findOneAndDelete(
                enrollmentQuery
            )
            if (!deletedEnrollment) {
                res.status(404).json({
                    success: false,
                    message: 'Enrollment not found!',
                })
                return
            }

            // Remove the enrollment from the student's courses array
            await Student.findByIdAndUpdate(
                { _id: deletedEnrollment.student },
                { $pull: { courses: deletedEnrollment.course } }
            )

            res.status(200).json({
                success: true,
                message: 'Enrollment deleted successfully',
            })
        } catch (error) {
            logger.error(error)
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            })
        }
    }

    static async getAllEnrollments(req: Request, res: Response) {
        try {
            const { id, role } = req.user as { [key: string]: string }
            const isInstructor = role === Role.INSTRUCTOR
            const query: any = {}
            if (!isInstructor) {
                // get student using the corresponding user id
                const student = await Student.findOne({ user: id })
                if (!student) {
                    res.status(401).json({
                        success: false,
                        message: 'Unauthorized: Student not found',
                    })
                    return
                }
                // restrict enrollments to the student's enrollments only
                query.student = student._id
            }
            const cacheKey = `enrollments:${query.student}`
            const enrollments = await getOrSetCache(cacheKey, async () => {
                console.log(`Enrollment query is ${query}`)
                const results = await Enrollment.find(query)
                    .populate({
                        path: 'student',
                        populate: {
                            path: 'user',
                            select: 'name -_id',
                        },
                        select: '_id level',
                    })
                    .populate('course', '_id name code')
                    .select('-__v')

                const foramattedResults = results.map((enrollment: any) => {
                    const { student, ...rest } = enrollment.toObject()
                    const { user, ...studentRest } = student
                    const studentDateCombined = {
                        ...studentRest,
                        ...user,
                        __v: undefined, // exclude from result
                        courses: undefined,
                        cgpa: undefined,
                        createdAt: undefined,
                        updatedAt: undefined,
                    }
                    return {
                        ...rest,
                        student: studentDateCombined,
                    }
                })
                return foramattedResults
            })

            res.status(200).json({
                success: true,
                enrollments,
            })
        } catch (error) {
            logger.error(error)
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            })
        }
    }
}

export default EnrollmentController
