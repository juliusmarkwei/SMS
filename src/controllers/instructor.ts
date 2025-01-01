import { Request, Response } from 'express'
import User from '../models/User'
import { requestBodyErrorsInterrupt } from '../utils/middleware/handleReqBodyErrors'
import { matchedData } from 'express-validator'
import { Role } from '../utils/enums'
import bcrypt from 'bcrypt'
import { emailNewUsers } from '../utils/mailer'
import { logger } from '../utils/logger'
import Instructor from '../models/Instructor'
import Course from '../models/Course'
import { IInstructor } from '../utils/types/instructor'
import { IUser } from '../utils/types/user'
import { ICourse } from '../utils/types/course'
import { getOrSetCache } from '../utils/cache'

class InstructorController {
    static async createInstructor(req: Request, res: Response) {
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
                department,
                salary,
                courses,
            } = matchedData(req)

            // Check if user already exists
            const userExists: IUser | null = await User.findOne({ email })
            if (userExists) {
                res.status(400).json({
                    success: false,
                    error: 'Instructor already exists!',
                })
                return
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(
                password,
                await bcrypt.genSalt(10)
            )

            // Create user and instructor simultaneously
            const user: IUser = new User({
                name,
                email,
                password: hashedPassword,
                role: Role.INSTRUCTOR,
                phone,
                gender,
                dateOfBirth,
                address,
            })

            // validate courses if provided
            if (courses && courses.length > 0) {
                const validCourses: ICourse[] = await Course.find({
                    _id: { $in: courses },
                })

                if (validCourses.length !== courses.length) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid courses provided',
                    })
                    return
                }
            }

            const instructor: IInstructor = new Instructor({
                user: user._id,
                department,
                salary,
                coursesTaught: courses || [],
            })

            // running both save operations concurrently
            await Promise.all([user.save(), instructor.save()])

            // Notify new instructors via email about their new account
            await emailNewUsers(user, password)

            res.status(201).json({
                success: true,
                message: `${Role.INSTRUCTOR} created successfully!`,
            })
        } catch (err) {
            logger.error(err)
            res.status(500).json({
                success: false,
                error: 'Internal server error.',
            })
        }
    }

    static async getAllInstructors(req: Request, res: Response) {
        try {
            const instructors = await getOrSetCache(
                'instructors:all',
                async () => {
                    const results: IInstructor[] = await Instructor.find()
                        .populate({
                            path: 'user',
                            select: 'name email phone dateOfBirth address',
                        })
                        .select('-__v')
                    const formattedResults: any[] = results.map(
                        (instructor) => {
                            const { user, ...instructorData } =
                                instructor.toObject()
                            return { ...user, ...instructorData }
                        }
                    )
                    return formattedResults
                }
            )

            res.status(200).json({
                success: true,
                instructors,
            })
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    'An error occurred while fetching instructors.',
            })
        }
    }

    static async getInstructorById(req: Request, res: Response) {
        const { instructorId } = req.params

        if (!instructorId) {
            res.status(400).json({
                success: false,
                error: 'instructorId is required',
            })
            return
        }

        const instructor: IInstructor | null = await getOrSetCache(
            `instructor:${instructorId}`,
            async () => {
                const result: IInstructor | null = await Instructor.findById(
                    instructorId
                )
                    .populate({
                        path: 'user',
                        select: 'name email phone dateOfBirth address',
                    })
                    .select('-__v')

                if (!result) {
                    return null
                }

                const { user, ...instructorData } = result.toObject()
                return { ...user, ...instructorData }
            }
        )

        if (!instructor) {
            res.status(404).json({
                success: false,
                error: 'Instructor not found',
            })
            return
        }

        res.status(200).json({
            success: true,
            data: instructor,
        })
    }

    static async updateInstructor(req: Request, res: Response) {
        const { instructorId } = req.params

        if (!instructorId) {
            res.status(400).json({
                success: false,
                error: 'instructorId is required',
            })
            return
        }

        const errors = requestBodyErrorsInterrupt(req, res)
        if (errors) return

        try {
            const {
                name,
                phone,
                gender,
                dateOfBirth,
                address,
                department,
                salary,
                courses,
            } = matchedData(req)

            // Validate courses if provided
            if (courses && Array.isArray(courses) && courses.length > 0) {
                const validCourses: ICourse[] = await Course.find({
                    _id: { $in: courses },
                })

                if (!validCourses || validCourses.length !== courses.length) {
                    res.status(400).json({
                        success: false,
                        error: 'One or more courses provided are invalid',
                    })
                    return
                }
            }

            // Fetch user ID from the request object
            const { id } = req?.user as { [key: string]: string }

            // Update User's basic details
            const updatedUser: IUser | null = await User.findByIdAndUpdate(id, {
                name,
                phone,
                gender,
                dateOfBirth,
                address,
            })

            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    error: 'User associated with the instructor not found',
                })
                return
            }

            // Append courses to the existing coursesTaught
            const updateFields: { [key: string]: any } = { department, salary }
            if (courses && courses.length > 0) {
                updateFields['$addToSet'] = {
                    coursesTaught: { $each: courses },
                }
            }

            // Update Instructor's specific details
            const updatedInstructor: IInstructor | null =
                await Instructor.findByIdAndUpdate(instructorId, updateFields)

            if (!updatedInstructor) {
                res.status(404).json({
                    success: false,
                    error: 'Instructor not found',
                })
                return
            }

            res.status(200).json({
                success: true,
                message: 'Instructor updated successfully',
            })
        } catch (error) {
            logger.error(error)
            res.status(500).json({
                success: false,
                error: 'Internal server error.',
            })
        }
    }

    static async deleteInstructor(req: Request, res: Response) {
        const { instructorId } = req.params

        if (!instructorId) {
            res.status(400).json({
                success: false,
                error: 'instructorId is required',
            })
            return
        }

        try {
            const deletedInstructor: IInstructor | null =
                await Instructor.findByIdAndDelete(instructorId)

            if (!deletedInstructor) {
                res.status(404).json({
                    success: false,
                    error: 'Instructor not found',
                })
                return
            }

            // Delete the associated user
            await User.findByIdAndDelete(deletedInstructor.user)

            res.status(200).json({
                success: true,
                message: 'Instructor deleted successfully',
            })
        } catch (error) {
            logger.error(error)
            res.status(500).json({
                success: false,
                error: 'Internal server error.',
            })
        }
    }
}

export default InstructorController
