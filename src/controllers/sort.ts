import { Request, Response } from "express";
import connect from "@/utils/dbConfig";
import Course from "@/models/Course";
import Student from "@/models/Student";
import { logger } from "@/utils/logger";
import { getOrSetCache } from "@/utils/cache";
import { quickSort, mergeSort } from "@/utils/sortingTechniques";
import { IStudent } from "@/utils/types/student";

connect();

class SortCourseAndStudentController {
    static async sortCourses(req: Request, res: Response) {
        const { sortBy, order = "asc", page = 1, limit = 10 } = req.query;
        if (!sortBy) {
            res.status(400).json({
                success: false,
                error: "Sort parameter is required.",
            });
            return;
        }

        try {
            // Fetch courses from cache or database
            const courses = await getOrSetCache("courses:all", async () => {
                return await Course.find();
            });

            if (!courses || courses.length === 0) {
                res.status(404).json({
                    success: false,
                    error: "No courses found.",
                });
                return;
            }

            // Compare function for sorting based on query
            const compareFn = (a: any, b: any) => {
                let result = 0;

                if (sortBy === "name") {
                    result = a.name.localeCompare(b.name);
                } else if (sortBy === "code") {
                    result = a.code.localeCompare(b.code);
                } else if (sortBy === "credits") {
                    result = a.credits - b.credits;
                } else if (sortBy === "semester") {
                    result = a.semester.localeCompare(b.semester);
                } else if (sortBy === "department") {
                    result = a.department.localeCompare(b.department);
                }

                // Reverse the order if 'desc' is specified
                return order === "desc" ? -result : result;
            };

            // Sort the courses using quickSort
            const sortedCourses = quickSort(courses, compareFn);

            // Pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

            res.status(200).json({
                success: true,
                count: sortedCourses.length,
                page: Number(page),
                limit: Number(limit),
                data: paginatedCourses,
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({
                success: false,
                error: "Internal server error.",
            });
        }
    }

    static async sortStudents(req: Request, res: Response) {
        const { sortBy, order = "asc", page = 1, limit = 10 } = req.query;
        if (!sortBy) {
            res.status(400).json({
                success: false,
                error: "Sort parameter is required.",
            });
            return;
        }

        try {
            // Fetch students from cache or database
            const students = await getOrSetCache("students:all", async () => {
                const students = await Student.find().populate({
                    path: "user",
                    select: "name email phone gender address",
                });

                const formattedStudents = students.map((student: IStudent) => {
                    const { user, ...studentData } = student.toObject();
                    return { ...user, ...studentData };
                });
                return formattedStudents;
            });

            if (!students || students.length === 0) {
                res.status(404).json({
                    success: false,
                    error: "No students found.",
                });
                return;
            }

            // Compare function for sorting based on query
            const compareFn = (a: any, b: any) => {
                let result = 0;

                if (sortBy === "name") {
                    result = a.name.localeCompare(b.name);
                } else if (sortBy === "level") {
                    result = a.level - b.level;
                } else if (sortBy === "cgpa") {
                    result = a.cgpa - b.cgpa;
                } else if (sortBy === "gender") {
                    result = a.gender.localeCompare(b.gender);
                } else if (sortBy === "address") {
                    result = a.address.localeCompare(b.address);
                }

                // Reverse the order if 'desc' is specified
                return order === "desc" ? -result : result;
            };

            // Sort the students using mergeSort
            const sortedStudents = mergeSort(students, compareFn);

            // Pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedStudents = sortedStudents.slice(
                startIndex,
                endIndex
            );

            res.status(200).json({
                success: true,
                count: sortedStudents.length,
                page: Number(page),
                limit: Number(limit),
                data: paginatedStudents,
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({
                success: false,
                error: "Internal server error.",
            });
        }
    }
}

export default SortCourseAndStudentController;
