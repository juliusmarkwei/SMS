import { Request, Response } from "express";
import Course from "@/models/Course";
import { logger } from "@/utils/logger";
import { requestBodyErrorsInterrupt } from "@/utils/middleware/handleReqBodyErrors";
import { matchedData } from "express-validator";
import { getOrSetCache } from "@/utils/cache";
import { ICourse } from "@/utils/types/course";

class CourseController {
    static async getAllCourses(req: Request, res: Response) {
        const {
            department,
            semester,
            credits,
            page = 1,
            limit = 10,
        } = req.query;

        try {
            // Pagination setup
            const pageNumber = parseInt(page as string, 10) || 1;
            const pageSize = parseInt(limit as string, 10) || 10;
            const skip = (pageNumber - 1) * pageSize;

            const query: any = {};
            if (department) {
                query.department = { $regex: department, $options: "i" };
            }
            if (semester) {
                query.semester = { $regex: semester, $options: "i" };
            }
            if (credits) {
                query.credits = parseInt(credits as string, 10);
            }

            const cacheKey = `courses:dep=${department || "all"}&sem=${
                semester || "all"
            }&credits=${credits}&page=${pageNumber}&limit=${pageSize}`;

            const courses = await getOrSetCache(cacheKey, async () => {
                const results: ICourse[] = await Course.find(query)
                    .select("-__v")
                    .skip(skip)
                    .limit(pageSize);
                return results;
            });

            // Get the total count of documents (for pagination metadata)
            const totalCourses = await Course.countDocuments(query);

            if (!courses || courses.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "No courses found",
                });
                return;
            }

            // Pagination metadata
            const totalPages = Math.ceil(totalCourses / pageSize);

            res.status(200).json({
                success: true,
                page: pageNumber,
                limit: pageSize,
                totalCourses,
                totalPages,
                courses,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    static async getCourse(req: Request, res: Response) {
        const { courseCode } = req.params;
        if (!courseCode) {
            res.status(400).json({
                message: "Course code is required",
                success: false,
            });
            return;
        }
        try {
            const course = await getOrSetCache(
                `course:courseCode=${courseCode}`,
                async () => {
                    const result: ICourse | null = await Course.findOne({
                        code: courseCode,
                    }).select("-__v");

                    return result;
                }
            );
            if (!course) {
                res.status(404).json({
                    message: `Course with code ${courseCode} not found`,
                    success: false,
                });
                return;
            }
            res.status(200).json({ success: true, course });
        } catch (error) {
            logger.error(error);
            res.status(500).json({
                message: "Internal server error",
                success: false,
            });
        }
    }

    static async createCourse(req: Request, res: Response) {
        const errors = requestBodyErrorsInterrupt(req, res);
        if (errors) return;

        const { name, code, description, credits, semester, department } =
            matchedData(req);

        try {
            const course: ICourse = new Course({
                name,
                code,
                description,
                credits,
                semester,
                department,
            });
            await course.save();
            res.status(201).json({
                success: true,
                message: "Course created successfully!",
            });
        } catch (error: any) {
            logger.error(error);

            // Handle duplicate key error (MongoDB error code 11000)
            if (error.code === 11000) {
                const duplicateField = Object.keys(
                    error.keyPattern || error.keyValue
                )[0];
                const duplicateValue = error.keyValue[duplicateField];
                res.status(400).json({
                    success: false,
                    message: `A course with the same ${duplicateField} (${duplicateValue}) already exists.`,
                });
                return;
            }

            // Handle validation errors
            if (error.name === "ValidationError") {
                const validationErrors = Object.values(error.errors).map(
                    (err: any) => err.message
                );
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: validationErrors,
                });
                return;
            }

            // General error fallback
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    static async updateCourse(req: Request, res: Response) {
        const { courseCode } = req.params;
        if (!courseCode) {
            res.status(400).json({
                message: "Course code is required",
                success: false,
            });
            return;
        }

        const errors = requestBodyErrorsInterrupt(req, res);
        if (errors) return;

        const { name, code, description, credits, semester, department } =
            matchedData(req);

        try {
            const course: ICourse | null = await Course.findOneAndUpdate(
                { code: courseCode },
                { name, code, description, credits, semester, department },
                { new: true }
            );
            if (!course) {
                res.status(404).json({
                    message: `Course with code ${courseCode} not found`,
                    success: false,
                });
                return;
            }
            res.status(200).json({
                message: "Course updated successfully!",
                success: true,
            });
        } catch (error: any) {
            logger.error(error);

            // Handle duplicate key error (MongoDB error code 11000)
            if (error.code === 11000) {
                const duplicateField = Object.keys(
                    error.keyPattern || error.keyValue
                )[0];
                const duplicateValue = error.keyValue[duplicateField];
                res.status(400).json({
                    message: `A course with the same ${duplicateField} (${duplicateValue}) already exists.`,
                    success: false,
                });
                return;
            }

            // Handle validation errors
            if (error.name === "ValidationError") {
                const validationErrors = Object.values(error.errors).map(
                    (err: any) => err.message
                );
                res.status(400).json({
                    message: "Validation error",
                    errors: validationErrors,
                    success: false,
                });
                return;
            }

            // General error fallback
            res.status(500).json({
                message: "Internal server error",
                success: false,
            });
        }
    }

    static async deleteCourse(req: Request, res: Response) {
        const { courseCode } = req.params;
        if (!courseCode) {
            res.status(400).json({
                message: "Course code is required",
                success: false,
            });
            return;
        }
        try {
            const course: ICourse | null = await Course.findOneAndDelete({
                code: courseCode,
            });
            if (!course) {
                res.status(404).json({
                    message: "Course not found",
                    success: false,
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Course deleted successfullt!",
            });
        } catch (error) {
            logger.error(error);
            res.status(500).json({
                message: "Internal server error",
                success: false,
            });
        }
    }
}

export default CourseController;
