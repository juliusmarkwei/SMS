import { Router } from "express";
import { isInstructor } from "../utils/middleware/isInstructor";
import EnrollmentController from "../controllers/enrollments";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Enrollments
 *     description: API for managing students course enrollments
 */

/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     summary: Enroll a student in a course
 *     description: Enroll a student in a specified course. Requires the studentId and courseCode.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Enrollments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: The student's ID
 *               courseCode:
 *                 type: string
 *                 description: The course code
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: The student's ID
 *               courseCode:
 *                 type: string
 *                 description: The course code
 *     responses:
 *       201:
 *         description: Student enrolled successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       401:
 *         description: Unauthorized to enroll other students
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post("/", EnrollmentController.enrollStudentInCourse);

/**
 * @swagger
 * /api/v1/enrollments/student/{studentId}:
 *   get:
 *     summary: Get all courses for a student
 *     description: Get all courses a specific student is enrolled in.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Enrollments
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The student's ID
 *     responses:
 *       200:
 *         description: A list of courses for the student
 *       400:
 *         description: Invalid studentId
 *       404:
 *         description: No courses found for the student
 *       500:
 *         description: Internal server error
 */
router.get(
    "/student/:studentId",
    EnrollmentController.getAllCoursesForAStudent
);

/**
 * @swagger
 * /api/v1/enrollments/{enrollmentId}:
 *   delete:
 *     summary: Delete a student's enrollment
 *     description: Delete a specific enrollment. Restricts students from deleting others' enrollments.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Enrollments
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *       400:
 *         description: Missing enrollmentId
 *       401:
 *         description: Unauthorized to delete other enrollments
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:enrollmentId", EnrollmentController.deleteEnrollment);

router.use(isInstructor);

/**
 * @swagger
 * /api/v1/enrollments/course/{courseCode}:
 *   get:
 *     summary: Get all students enrolled in a course
 *     description: Get all students enrolled in a specific course by course code.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Enrollments
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The course code
 *     responses:
 *       200:
 *         description: A list of students enrolled in the course
 *       400:
 *         description: Invalid courseCode
 *       404:
 *         description: Course not found or no students enrolled
 *       500:
 *         description: Internal server error
 */
router.get(
    "/course/:courseCode",
    EnrollmentController.getAllStudentsForACourse
);

/**
 * @swagger
 * /api/v1/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     description: Retrieve all enrollments with student and course details.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Enrollments
 *     responses:
 *       200:
 *         description: A list of all enrollments
 *       500:
 *         description: Internal server error
 */
router.get("/", EnrollmentController.getAllEnrollments);

export { router as enrollmentRouter };
