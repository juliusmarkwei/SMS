import { Request, Response } from "express";
import connect from "@/utils/dbConfig";
import User from "@/models/User";
import { Types } from "mongoose";
import { requestBodyErrorsInterrupt } from "@/utils/middleware/handleReqBodyErrors";
import { matchedData } from "express-validator";
import Student from "@/models/Student";
import { Role } from "@/utils/enums";
import bcrypt from "bcrypt";
import { emailNewUsers } from "@/utils/mailer";
import { logger } from "@/utils/logger";
import { getOrSetCache } from "@/utils/cache";
import { IUser } from "@/utils/types/user";
import { IStudent } from "@/utils/types/student";

connect();

class StudentController {
    static async createStudent(req: Request, res: Response) {
        const errors = requestBodyErrorsInterrupt(req, res);
        if (errors) return;

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
            const userExists: IUser | null = await User.findOne({ email });
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
            const user: IUser = new User({
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
            const student: IStudent = new Student({
                user: user._id,
                level,
                cgpa,
            });

            // running both save operations concurrently
            await Promise.all([user.save(), student.save()]);

            // Notify new user via email of their new account
            await emailNewUsers(user, password);

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

            // Validate if `studentId` is a valid MongoDB ObjectId
            if (!Types.ObjectId.isValid(studentId)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid Student ID format",
                });
                return;
            }

            // Fetch the student from cache or database
            const student = await getOrSetCache(
                `student:${studentId}`,
                async () => {
                    const studentDoc: IStudent | null = await Student.findById(
                        new Types.ObjectId(studentId)
                    )
                        .populate({
                            path: "user",
                            select: "name email phone dateOfBirth -_id",
                        })
                        .select("level cgpa courses _id");

                    if (!studentDoc) {
                        throw new Error("Student not found");
                    }

                    // Convert to plain object and merge fields
                    console.log(studentDoc);
                    const studentObject = studentDoc.toObject();
                    const { user, ...studentData } = studentObject;
                    return { ...user, ...studentData };
                }
            );

            res.status(200).json({
                success: true,
                student,
            });
        } catch (error: any) {
            // Handle errors gracefully
            res.status(error.message === "Student not found" ? 404 : 500).json({
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
                const updatedUser: IUser | null = await User.findByIdAndUpdate(
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

                const updatedStudent: IStudent | null =
                    await Student.findByIdAndUpdate(
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

                const updatedUser: IUser | null = await User.findByIdAndUpdate(
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
        const { name, gender, level, cgpa } = req.query;
        logger.debug(req.query);
        try {
            const query: any = {};

            if (level) {
                query["level"] = parseInt(level as string, 10);
            }
            if (cgpa) {
                const cgpaFilter =
                    typeof cgpa === "string" ? cgpa : cgpa.toString();

                if (cgpaFilter.includes("gte:")) {
                    const value = parseFloat(cgpaFilter.split(":")[1]);
                    query["cgpa"] = { ...query["cgpa"], $gte: value };
                } else if (cgpaFilter.includes("lte:")) {
                    const value = parseFloat(cgpaFilter.split(":")[1]);
                    query["cgpa"] = { ...query["cgpa"], $lte: value };
                } else {
                    const value = parseFloat(cgpaFilter);
                    query["cgpa"] = value;
                }
            }

            console.log(query);
            // Fetch all students and populate the user data
            const students: IStudent[] | null = await Student.find(query)
                .populate({
                    path: "user",
                    select: "name email phone dateOfBirth address gender -_id",
                    match: {
                        ...(name
                            ? {
                                  name: {
                                      $regex: new RegExp(name as string, "i"),
                                  },
                              }
                            : {}),
                        ...(gender ? { gender } : {}),
                    },
                })
                .select("level cgpa courses _id")
                .exec();

            const filteredStudents = students.filter(
                (student) => student.user !== null
            );

            // Convert each student document to a plain object and merge the user fields
            const mergedStudents = filteredStudents.map((student) => {
                const studentObj = student.toObject();
                const { user, ...studentData } = studentObj;
                return { ...user, ...studentData };
            });

            res.status(200).json({
                success: true,
                students: mergedStudents,
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

    // instructors only
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
            const deletedStudent: IStudent | null =
                await Student.findByIdAndDelete(new Types.ObjectId(studentId));

            if (!deletedStudent) {
                res.status(404).json({
                    success: false,
                    error: "Student not found",
                });
                return;
            }

            // Delete the associated user
            const deletedUser: IUser | null = await User.findByIdAndDelete(
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

export default StudentController;
