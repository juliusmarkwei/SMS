import { Router } from "express";
import CourseController from "../controllers/courses";
import {
    courseCreationValidationSchema,
    courseUpdationValidationSchema,
} from "../utils/middleware/validators/course";
import { checkSchema } from "express-validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: API endpoints for managing courses
 */

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieves a list of all courses with optional filters (department, semester, credits) and pagination.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: query
 *         name: department
 *         description: Filter courses by department
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         description: Filter courses by semester
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: credits
 *         description: Filter courses by number of credits
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         description: Page number for pagination (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         description: Number of courses per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of courses with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalCourses:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       credits:
 *                         type: integer
 *                       semester:
 *                         type: string
 *                       department:
 *                         type: string
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalCourses:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       credits:
 *                         type: integer
 *                       semester:
 *                         type: string
 *                       department:
 *                         type: string
 *       404:
 *         description: No courses found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No courses found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get("/", CourseController.getAllCourses);

/**
 * @swagger
 * /api/v1/courses/{courseCode}:
 *   get:
 *     summary: Get a specific course by its code
 *     description: Retrieves details of a specific course using the provided course code.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         description: The course code for the course to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details of the requested course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 course:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     credits:
 *                       type: integer
 *                     semester:
 *                       type: string
 *                     department:
 *                       type: string
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 course:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     credits:
 *                       type: integer
 *                     semester:
 *                       type: string
 *                     department:
 *                       type: string
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course with code {courseCode} not found"
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Course with code {courseCode} not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get("/:courseCode", CourseController.getCourse);

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     summary: Create a new course
 *     description: Creates a new course, only accessible by instructors.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Courses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *                 required: false
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: string
 *               department:
 *                 type: string
 *             required:
 *               name
 *               code
 *               credits
 *               semester
 *               department
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *                 required: false
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: string
 *               department:
 *                 type: string
 *             required:
 *               name
 *               code
 *               credits
 *               semester
 *               department
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Course created successfully!"
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Course created successfully!"
 *       400:
 *         description: Validation or duplicate field error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "A course with the same {field} already exists."
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "A course with the same {field} already exists."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *           application/x-www-form-urlencoded:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post(
    "/",
    checkSchema(courseCreationValidationSchema),
    CourseController.createCourse
);

/**
 * @swagger
 * /api/v1/courses/{courseCode}:
 *   put:
 *     summary: Update a course by its code
 *     description: Updates the details of an existing course based on the course code.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         description: The course code for the course to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: string
 *               department:
 *                 type: string
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Course updated successfully!"
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Course with code {courseCode} not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.put(
    "/:courseCode",
    checkSchema(courseUpdationValidationSchema),
    CourseController.updateCourse
);

/**
 * @swagger
 * /api/v1/courses/{courseCode}:
 *   delete:
 *     summary: Delete a course by its code
 *     description: Deletes a course based on the provided course code.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         description: The course code for the course to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Course deleted successfully!"
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Course with code {courseCode} not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete("/:courseCode", CourseController.deleteCourse);
export { router as courseRouter };
