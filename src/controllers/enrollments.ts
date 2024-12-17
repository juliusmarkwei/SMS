import { Response, Request } from "express";
import connect from "@/utils/dbConfig";
import Enrollment from "@/models/Enrollment";
import { logger } from "@/utils/logger";
import { getOrSetCache } from "@/utils/cache";
import Student from "@/models/Student";
import Course from "@/models/Course";
import { Role } from "@/utils/enums";
import { ICourse } from "@/utils/types/course";
import { IStudent } from "@/utils/types/student";

connect();

class EnrollmentController {
    static async enrollStudentInCourse(req: Request, res: Response) {
        const { studentId, courseCode } = req.body;
        if (!studentId || !courseCode) {
            res.status(400).json({
                message: "studentId and courseCode are required",
                success: false,
            });
            return;
        }

        const { _id } =
            ((await Course.findOne({ code: courseCode }).select(
                "_id"
            )) as ICourse) || null;

        try {
            const enrollment = new Enrollment({
                student: studentId,
                course: _id,
            });
            await enrollment.save();

            // add courseId to courses for the student
            await Student.findByIdAndUpdate(studentId, {
                $push: { courses: _id },
            });

            res.status(201).json({
                success: true,
                message: "Student enrolled successfully!",
            });
        } catch (error: any) {
            logger.error(error);

            // handle mongoose error (unique constraint)
            if (error.code === 11000) {
                res.status(400).json({
                    success: false,
                    message: `Student is already enrolled in course ${courseCode}`,
                });
                return;
            }

            if (error.name === "ValidationError") {
                const validationErrors = Object.values(error.errors).map(
                    (err: any) => err.message
                );
                res.status(400).json({
                    success: false,
                    message: validationErrors.join(", "),
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    static async getAllCoursesForAStudent(req: Request, res: Response) {
        const { studentId } = req.params;
        if (!studentId) {
            res.status(400).json({
                message: "Student ID is required",
                success: false,
            });
            return;
        }

        const query: any = { _id: studentId };

        // check to restrict student's to view only their courses
        const { id, role } = req.user as { [key: string]: string };
        const isInstructor = role === Role.INSTRUCTOR;
        if (!isInstructor) {
            query.user = id;
        }

        try {
            const cacheKey = isInstructor
                ? `enrollments:studentId=${studentId}`
                : `enrollments:studentId=${studentId}&user=${id}`;

            const courses = await getOrSetCache(cacheKey, async () => {
                const results: IStudent[] | null = await Student.find(query)
                    .populate("courses")
                    .select("-__v");
                return results
                    .map((student: any) => student.toObject().courses)
                    .flat();
            });

            res.status(200).json({ success: true, courses });
        } catch (error) {
            logger.error(error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    static async getAllStudentsForACourse(req: Request, res: Response) {
        const { courseCode } = req.params;

        if (!courseCode) {
            res.status(400).json({
                message: "Course code is required",
                success: false,
            });
            return;
        }

        try {
            const cacheKey = `enrollments:courseCode=${courseCode}`;

            const students = await getOrSetCache(cacheKey, async () => {
                const course: ICourse | null = await Course.findOne({
                    code: courseCode,
                }).select("_id");

                if (!course) {
                    throw new Error(`Course with code ${courseCode} not found`);
                }

                const results: IStudent[] | null = await Student.find({
                    courses: course._id,
                })
                    .populate("user", "name email phone -_id")
                    .select("-__v -createdAt -updatedAt -courses");

                const foramattedResults = results.map((student: any) => {
                    const { user, ...rest } = student.toObject();
                    return {
                        ...rest,
                        ...user,
                    };
                });
                return foramattedResults;
            });

            res.status(200).json({ success: true, students });
        } catch (error: any) {
            logger.error(error.message || error);
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error",
            });
        }
    }

    static async deleteEnrollment(req: Request, res: Response) {
        const { enrollmentId } = req.params;

        if (!enrollmentId) {
            res.status(400).json({
                success: false,
                message: "enrollmentId is required",
            });
            return;
        }

        // Build query to restrict students from deleting other enrollments
        const { id, role } = req.user as { [key: string]: string };
        const isInstructor = role === Role.INSTRUCTOR;

        try {
            const enrollmentQuery: any = { _id: enrollmentId };

            if (!isInstructor) {
                // Get the student's _id
                const student: IStudent | null = await Student.findOne({
                    user: id,
                }).select("_id");
                if (!student) {
                    res.status(403).json({
                        success: false,
                        message: "Unauthorized: Student not found",
                    });
                    return;
                }

                // Restrict deletion to the student's enrollment only
                enrollmentQuery.student = student._id;
            }

            // Delete the enrollment
            const deletedEnrollment: any = await Enrollment.findOneAndDelete(
                enrollmentQuery
            );
            if (!deletedEnrollment) {
                res.status(404).json({
                    success: false,
                    message: "Enrollment not found!",
                });
                return;
            }

            // Remove the enrollment from the student's courses array
            await Student.updateOne(
                { _id: deletedEnrollment.student },
                { $pull: { courses: enrollmentId } }
            );

            res.status(200).json({
                success: true,
                message: "Enrollment deleted successfully",
            });
        } catch (error) {
            logger.error(error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    static async getAllEnrollments(req: Request, res: Response) {
        try {
            const enrollments = await getOrSetCache(
                "enrollments:all",
                async () => {
                    const results = await Enrollment.find({})
                        .populate({
                            path: "student",
                            populate: {
                                path: "user",
                                select: "name email phone _id",
                            },
                        })
                        .populate("course", "_id name code")
                        .select("-__v");

                    const foramattedResults = results.map((enrollment: any) => {
                        const { student, ...rest } = enrollment.toObject();
                        const { user, ...studentRest } = student;
                        const studentDateCombined = {
                            ...studentRest,
                            ...user,
                            __v: undefined, // exclude from result
                            courses: undefined,
                            cgps: undefined,
                            createdAt: undefined,
                            updatedAt: undefined,
                        };
                        return {
                            ...rest,
                            student: studentDateCombined,
                        };
                    });
                    return foramattedResults;
                }
            );

            res.status(200).json({
                success: true,
                enrollments,
            });
        } catch (error) {
            logger.error(error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}

export default EnrollmentController;
