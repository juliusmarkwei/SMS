import { Request, Response } from 'express'
import User from '../models/User'
import { Types } from 'mongoose'
import { requestBodyErrorsInterrupt } from '../utils/middleware/handleReqBodyErrors'
import { matchedData } from 'express-validator'
import Student from '../models/Student'
import { Role } from '../utils/enums'
import bcrypt from 'bcrypt'
import { emailNewUsers } from '../utils/mailer'
import { logger } from '../utils/logger'
import { getOrSetCache } from '../utils/cache'
import { IUser } from '../utils/types/user'
import { IStudent } from '../utils/types/student'

class StudentController {
    static async getStudentById(studentId: string | number) {
        return await Student.findById(studentId)
    }

    static async createStudent(req: Request, res: Response) {
        const errors = requestBodyErrorsInterrupt(req, res)
        if (errors) return

        try {
            const {
                name,
                email,
                password,
                phone,
                gender,
                dateOfBirth,
                address,
                level,
                cgpa,
            } = matchedData(req)

            // Check if user already exists
            const userExists: IUser | null = await User.findOne({ email })
            if (userExists) {
                res.status(400).json({
                    success: false,
                    error: 'Student already exists!',
                })
                return
            }

            // Hash password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            // Create user and student simultaneously
            const user: IUser = new User({
                name,
                email,
                password: hashedPassword,
                role: Role.STUDENT,
                phone,
                gender,
                dateOfBirth,
                address,
            })

            // Saving user and creating student in parallel
            const student: IStudent = new Student({
                user: user._id,
                level,
                cgpa,
            })

            // running both save operations concurrently
            await Promise.all([user.save(), student.save()])

            // Notify new user via email of their new account
            await emailNewUsers(user, password)

            res.status(201).json({
                success: true,
                message: `${Role.STUDENT} created successfully!`,
                data: { studentId: student._id, email: user.email },
            })
        } catch (err) {
            logger.error(err)
            res.status(500).json({
                success: false,
                error: 'Internal server error.',
            })
        }
    }

    // View user info (students & instructors allowed)
    static async getSingleStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.params

            if (!studentId || !Types.ObjectId.isValid(studentId)) {
                res.status(400).json({
                    success: false,
                    error: 'studentId not provided or is invalid',
                })
                return
            }

            const query: any = { _id: studentId }

            // check to restrict student's to view only their courses
            const { id, role } = req.user as { [key: string]: string }
            const isInstructor = role === Role.INSTRUCTOR
            if (!isInstructor) {
                query.user = id
            }

            // Fetch the student from cache or database
            const student = await getOrSetCache(
                `student:studId=${studentId}&user=${id}`,
                async () => {
                    const studentDoc: IStudent | null = await Student.findOne(
                        query
                    )
                        ?.populate({
                            path: 'user',
                            select: 'name email phone dateOfBirth -_id',
                        })
                        .select('level cgpa courses _id')

                    if (!studentDoc) {
                        if (isInstructor) {
                            const error = new Error('Student not found')
                            error.name = 'StudentNotFound'
                            throw error
                        } else {
                            const error = new Error(
                                "You are not authorized to view this student's information"
                            )
                            error.name = 'NotAuthorized'
                            throw error
                        }
                    }

                    // Convert to plain object and merge fields
                    const studentObject = studentDoc.toObject()
                    const { user, ...studentData } = studentObject
                    return { ...user, ...studentData }
                }
            )

            res.status(200).json({
                success: true,
                student,
            })
        } catch (error: any) {
            // Handle errors gracefully
            res.status(
                ['StudentNotFound', 'NotAuthorized'].includes(error.name)
                    ? 404
                    : 500
            ).json({
                success: false,
                error:
                    error.message ||
                    'An error occurred while retrieving the student information',
            })
        }
    }

    // update my user info (student & instructors allowed)
    static async updateSingleStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.params

            if (!studentId) {
                res.status(400).json({
                    success: false,
                    error: 'Student ID is required',
                })
                return
            }

            const validationErrors = requestBodyErrorsInterrupt(req, res)
            if (validationErrors) return

            // Extract validated data
            const { name, phone, dateOfBirth, address, gender, level, cgpa } =
                matchedData(req)
            const { id, role } = req.user as { [key: string]: string }

            const basicUpdates = { name, phone, dateOfBirth, address, gender }

            if (role === Role.STUDENT) {
                // Students can only update their own basic profile
                const foundStudent = await StudentController.getStudentById(
                    studentId
                )

                if (!foundStudent && foundStudent.user.toString() !== id) {
                    res.status(401).json({
                        success: false,
                        error: "You are not authorized to update this student's information",
                    })
                    return
                }

                if (level || cgpa) {
                    res.status(401).json({
                        success: false,
                        error: "You are not authorized to update this student's level or cgpa",
                    })
                    return
                }
                await User.findByIdAndUpdate(id, basicUpdates, {
                    new: true,
                    runValidators: true,
                })
            } else {
                // Instructors can update student-specific data and basic user data
                const studentUpdates = { level, cgpa }

                const updatedStudent: IStudent | null =
                    await Student.findByIdAndUpdate(studentId, studentUpdates, {
                        new: true,
                        runValidators: true,
                    })

                if (!updatedStudent) {
                    res.status(404).json({
                        success: false,
                        error: 'Student not found',
                    })
                    return
                }

                const updatedUser: IUser | null = await User.findByIdAndUpdate(
                    updatedStudent.user,
                    basicUpdates,
                    { new: true, runValidators: true }
                )

                if (!updatedUser) {
                    res.status(404).json({
                        success: false,
                        error: 'Associated user not found',
                    })
                    return
                }
            }

            res.status(200).json({
                success: true,
                message: 'Student updated successfully',
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    'An error occurred while updating the student',
            })
        }
    }

    // Get all students (instructors only)
    static async getAllStudents(req: Request, res: Response) {
        const { name, gender, level, cgpa, page = 1, limit = 10 } = req.query
        logger.debug(req.query)

        try {
            const query: any = {}

            // Filtering for level
            if (level) {
                query['level'] = parseInt(level as string, 10)
            }

            // Filtering for cgpa
            if (cgpa) {
                const cgpaFilter =
                    typeof cgpa === 'string' ? cgpa : cgpa.toString()

                if (cgpaFilter.includes('gte:')) {
                    const value = parseFloat(cgpaFilter.split(':')[1])
                    query['cgpa'] = { ...query['cgpa'], $gte: value }
                } else if (cgpaFilter.includes('lte:')) {
                    const value = parseFloat(cgpaFilter.split(':')[1])
                    query['cgpa'] = { ...query['cgpa'], $lte: value }
                } else {
                    const value = parseFloat(cgpaFilter)
                    query['cgpa'] = value
                }
            }

            const cacheKey = `students:name=${name}&gender=${gender}&level=${level}&cgpa=${cgpa}&page=${page}&limit=${limit}`

            const students: IStudent[] | null = await getOrSetCache(
                cacheKey,
                async () => {
                    const skip =
                        (parseInt(page as string, 10) - 1) *
                        parseInt(limit as string, 10)

                    const students: IStudent[] | null = await Student.find(
                        query
                    )
                        ?.populate({
                            path: 'user',
                            select: 'name email phone dateOfBirth address gender -_id',
                            match: {
                                ...(name
                                    ? {
                                          name: {
                                              $regex: new RegExp(
                                                  name as string,
                                                  'i'
                                              ),
                                          },
                                      }
                                    : {}),
                                ...(gender ? { gender } : {}),
                            },
                        })
                        .select('level cgpa courses _id')
                        .skip(skip)
                        .limit(parseInt(limit as string, 10))
                        .exec()

                    // Filter out results where the user field is null
                    const filteredStudents = students.filter(
                        (student) => student.user !== null
                    )

                    if (!filteredStudents || filteredStudents.length === 0) {
                        return null
                    }

                    // Merge the user fields into the main student object
                    const mergedStudents = filteredStudents.map((student) => {
                        const studentObj = student.toObject()
                        const { user, ...studentData } = studentObj
                        return { ...user, ...studentData }
                    })

                    return mergedStudents
                }
            )

            // Calculate total count (needed for pagination metadata)
            const totalCount = await Student.countDocuments(query)

            res.status(200).json({
                success: true,
                currentPage: parseInt(page as string, 10),
                totalPages: Math.ceil(
                    totalCount / parseInt(limit as string, 10)
                ),
                count: totalCount,
                size: parseInt(limit as string, 10),
                data: students,
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    'An error occurred while fetching students.',
            })
        }
    }

    // instructors only
    static async deleteStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.params

            if (!studentId) {
                res.status(400).json({
                    success: false,
                    error: 'Student ID is required',
                })
                return
            }

            // Delete the student
            const deletedStudent: IStudent | null =
                await Student.findByIdAndDelete(studentId)

            if (!deletedStudent) {
                res.status(404).json({
                    success: false,
                    error: 'Student not found',
                })
                return
            }

            // Delete the associated user
            const deletedUser: IUser | null = await User.findByIdAndDelete(
                deletedStudent.user
            )

            if (!deletedUser) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                })
                return
            }

            res.status(200).json({
                success: true,
                message: 'Student deleted successfully',
            })
        } catch (error: any) {
            logger.info(`Error is: ${error}`)
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    'An error occurred while deleting the student',
            })
        }
    }
}

export default StudentController
