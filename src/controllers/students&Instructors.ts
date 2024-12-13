import { Request, Response } from "express";
import connect from "@/utils/dbConfig";
import User from "@/models/User";
import { Types } from "mongoose";
import { requestBodyErrorsInterrupt } from "@/utils/middleware/handleReqBodyErrors";
import { matchedData } from "express-validator";
import Student from "@/models/Student";
import { Role } from "@/utils/enums";
import Instructor from "@/models/Instructor";
import bcrypt from "bcrypt";
import { emailNewUsers } from "@/utils/mailer";
import { logger } from "@/utils/logger";

connect();

class StudentInstructorController {
    static async createStudent(req: Request, res: Response) {
        const error = requestBodyErrorsInterrupt(req, res);
        if (error) return;

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
            } = matchedData(req);

            // Check if user already exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                res.status(400).json({
                    success: false,
                    error: "Student already exists!",
                });
                return;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(
                password,
                await bcrypt.genSalt(10)
            );

            // Create user and student simultaneously
            const user = new User({
                name,
                email,
                password: hashedPassword,
                role: Role.STUDENT,
                phone,
                gender,
                dateOfBirth,
                address,
            });

            // Saving user and creating student in parallel
            const student = new Student({ user: user._id, level, cgpa });

            // running both save operations concurrently
            await Promise.all([user.save(), student.save()]);

            // Notify new user via email of their new account
            await emailNewUsers(user);

            res.status(201).json({
                success: true,
                message: `${Role.STUDENT} created successfully!`,
                data: { id: user._id, email: user.email },
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({
                success: false,
                error: "Internal server error.",
            });
        }
    }

    // static async createInstructor(req: Request, res: Response) {
    //     const error = requestBodyErrorsInterrupt(req, res);
    //     if (error) return;

    //     try {
    //         const {
    //             name,
    //             email,
    //             password,
    //             phone,
    //             gender,
    //             dateOfBirth,
    //             address,
    //             department,
    //             salary,
    //         } = matchedData(req);

    //         // Check if user already exists
    //         const userExists = await User.findOne({ email });
    //         if (userExists) {
    //             res.status(400).json({
    //                 success: false,
    //                 error: "Instructor already exists!",
    //             });
    //             return;
    //         }

    //         // Hash password
    //         const hashedPassword = await bcrypt.hash(
    //             password,
    //             await bcrypt.genSalt(10)
    //         );

    //         // Create user and instructor simultaneously
    //         const user = new User({
    //             name,
    //             email,
    //             password: hashedPassword,
    //             role: Role.INSTRUCTOR,
    //             phone,
    //             gender,
    //             dateOfBirth,
    //             address,
    //         });

    //         const instructor = new Instructor({
    //             user: user._id,
    //             department,
    //             salary,
    //         });

    //         // running both save operations concurrently
    //         await Promise.all([user.save(), instructor.save()]);

    //         // Notify new isntructors via email about their new account
    //         await emailNewUsers(user);

    //         res.status(201).json({
    //             success: true,
    //             message: `${Role.INSTRUCTOR} created successfully!`,
    //             data: { id: user._id, email: user.email },
    //         });
    //     } catch (err) {
    //         logger.error(err);
    //         res.status(500).json({
    //             success: false,
    //             error: "Internal server error.",
    //         });
    //     }
    // }

    // View user info (students & instructors allowed)
    static async singleStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                res.status(400).json({
                    success: false,
                    error: "Student ID is required",
                });
                return;
            }

            // Fetch the student with populated user info
            const student = await Student.findById(
                new Types.ObjectId(studentId)
            )
                .populate({
                    path: "user",
                    select: "name email phone dateOfBirth address",
                })
                .select("level cgpa courses");

            if (!student) {
                res.status(404).json({
                    success: false,
                    error: "Student not found",
                });
                return;
            }

            res.json({
                success: true,
                student,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    "An error occurred while retrieving the student information",
            });
        }
    }

    // update my user info (student & instructors allowed)
    static async updateSingleStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                res.status(400).json({
                    success: false,
                    error: "Student ID is required",
                });
                return;
            }

            const validationErrors = requestBodyErrorsInterrupt(req, res);
            if (validationErrors) return;

            const { name, phone, dateOfBirth, address, gender, level, cgpa } =
                matchedData(req);

            const updates: any = { name, phone, dateOfBirth, address, gender };

            // Role-based updates
            if (req.user!.role === Role.STUDENT) {
                // Students can only update their basic profile information
                const updatedUser = await User.findByIdAndUpdate(
                    new Types.ObjectId(studentId),
                    updates,
                    { new: true, runValidators: true }
                );

                if (!updatedUser) {
                    res.status(404).json({
                        success: false,
                        error: "User not found",
                    });
                    return;
                }
            } else {
                // Instructors can update both user and student-specific data
                const studentUpdates = { level, cgpa };

                const updatedStudent = await Student.findByIdAndUpdate(
                    new Types.ObjectId(studentId),
                    studentUpdates,
                    { new: true, runValidators: true }
                );

                if (!updatedStudent) {
                    res.status(404).json({
                        success: false,
                        error: "Student not found",
                    });
                    return;
                }

                const updatedUser = await User.findByIdAndUpdate(
                    new Types.ObjectId(studentId),
                    updates,
                    { new: true, runValidators: true }
                );

                if (!updatedUser) {
                    res.status(404).json({
                        success: false,
                        error: "User not found",
                    });
                    return;
                }
            }

            res.json({
                success: true,
                message: "User updated successfully",
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    "An error occurred while updating the user",
            });
        }
    }

    // Get all students (instructors only)
    static async getAllStudents(req: Request, res: Response) {
        try {
            // Fetch all students and populate the user data
            const students = await Student.find()
                .populate({
                    path: "user",
                    select: "name email phone dateOfBirth address",
                })
                .select("level cgpa courses");

            res.status(200).json({
                success: true,
                students,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    "An error occurred while fetching students.",
            });
        }
    }

    // Get all instructors (instructors only)
    // static async getInstructors(req: Request, res: Response) {
    //     try {
    //         const instructors = await Instructor.find()
    //             .populate({
    //                 path: "user",
    //                 select: "name email phone dateOfBirth address",
    //             })
    //             .populate({
    //                 path: "coursesTaught",
    //                 select: "courseName courseCode",
    //             })
    //             .select("department");

    //         res.status(200).json({
    //             success: true,
    //             instructors,
    //         });
    //     } catch (error: any) {
    //         res.status(500).json({
    //             success: false,
    //             error:
    //                 error.message ||
    //                 "An error occurred while fetching instructors.",
    //         });
    //     }
    // }

    // Delete specific-student and it equivalent user recors
    static async deleteStudent(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                res.status(400).json({
                    success: false,
                    error: "Student ID is required",
                });
                return;
            }

            // Delete the student
            const deletedStudent = await Student.findByIdAndDelete(
                new Types.ObjectId(studentId)
            );

            if (!deletedStudent) {
                res.status(404).json({
                    success: false,
                    error: "Student not found",
                });
                return;
            }

            // Delete the associated user
            const deletedUser = await User.findByIdAndDelete(
                new Types.ObjectId(studentId)
            );

            if (!deletedUser) {
                res.status(404).json({
                    success: false,
                    error: "User not found",
                });
                return;
            }

            res.json({
                success: true,
                message: "Student deleted successfully",
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error:
                    error.message ||
                    "An error occurred while deleting the student",
            });
        }
    }
}

export default StudentInstructorController;
