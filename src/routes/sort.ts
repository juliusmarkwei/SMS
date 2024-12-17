import { Router } from "express";
import SortCourseAndStudentController from "@/controllers/sort";

const sortStudentRouter = Router();
const sortCourseRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Sort (Students and Courses)
 *     description: API for sorting students and courses
 */

/**
 * @swagger
 * /api/v1/sort/students:
 *   get:
 *     summary: Sort students based on specific criteria
 *     description: Sorts the students based on a specified parameter such as name, level, cgpa, gender, or address. Supports pagination.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Sort (Students and Courses)
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         required: true
 *         description: The field to sort by. (e.g., name, level, cgpa, gender, address)
 *       - in: query
 *         name: order
 *         required: false
 *         description: The order of sorting. (e.g., "asc", "desc"). Default is "asc".
 *       - in: query
 *         name: page
 *         required: false
 *         description: The page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         required: false
 *         description: The number of results per page. Default is 10.
 *     responses:
 *       200:
 *         description: Successfully sorted students with pagination.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       level:
 *                         type: integer
 *                       cgpa:
 *                         type: number
 *                       gender:
 *                         type: string
 *                       address:
 *                         type: string
 *       400:
 *         description: Sort parameter is required.
 *       404:
 *         description: No students found.
 *       500:
 *         description: Internal server error.
 */
sortStudentRouter.get("/", SortCourseAndStudentController.sortStudents);

/**
 * @swagger
 * /api/v1/sort/courses:
 *   get:
 *     summary: Sort courses based on specific criteria
 *     description: Sorts courses based on fields like name, code, credits, semester, or department. Supports pagination.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Sort (Students and Courses)
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         required: true
 *         description: The field to sort by. (e.g., name, code, credits, semester, department)
 *       - in: query
 *         name: order
 *         required: false
 *         description: The order of sorting. (e.g., "asc", "desc"). Default is "asc".
 *       - in: query
 *         name: page
 *         required: false
 *         description: The page number for pagination. Default is 1.
 *       - in: query
 *         name: limit
 *         required: false
 *         description: The number of results per page. Default is 10.
 *     responses:
 *       200:
 *         description: Successfully sorted courses with pagination.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       credits:
 *                         type: integer
 *                       semester:
 *                         type: string
 *                       department:
 *                         type: string
 *       400:
 *         description: Sort parameter is required.
 *       404:
 *         description: No courses found.
 *       500:
 *         description: Internal server error.
 */
sortCourseRouter.get("/", SortCourseAndStudentController.sortCourses);

export { sortStudentRouter, sortCourseRouter };
