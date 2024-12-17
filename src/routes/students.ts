import { Router } from "express";
import { checkSchema } from "express-validator";
import StudentController from "@/controllers/students";
import { isInstructor } from "@/utils/middleware/isInstructor";
import { studentUpdateValidationScheme } from "@/utils/middleware/validators/student";
import { signupStudentValidationScheme } from "@/utils/middleware/validators/student";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: API for managing students
 */

/**
 * @swagger
 * /api/v1/students/{studentId}:
 *   get:
 *     summary: Get a single student
 *     security:
 *       - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 student:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     address:
 *                       type: string
 *                     level:
 *                       type: number
 *                     cgpa:
 *                       type: number
 *       400:
 *         description: Invalid student ID
 *       404:
 *         description: Student not found
 */
router.get("/:studentId", StudentController.getSingleStudent);

/**
 * @swagger
 * /api/v1/students/{studentId}:
 *   put:
 *     summary: Update a student's details
 *     security:
 *       - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *               level:
 *                 type: number
 *               cgpa:
 *                 type: number
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       400:
 *         description: Invalid student ID or bad request
 *       401:
 *         description: Unauthorized to update this student
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.put(
    "/:studentId",
    checkSchema(studentUpdateValidationScheme),
    StudentController.updateSingleStudent
);

router.use(isInstructor);

/**
 * @swagger
 * /api/v1/students:
 *   post:
 *     summary: Create a new student
 *     description: This endpoint allows instructors to create a new student. It validates the input data and sends an email notification to the new student upon successful creation.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Students
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - gender
 *               - dateOfBirth
 *               - address
 *               - level
 *               - cgpa
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *                 description: Full name of the student.
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *                 description: Email address of the student.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *                 description: Password for the student's account.
 *               phone:
 *                 type: string
 *                 example: "+123456789"
 *                 description: Contact number of the student.
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *                 description: Gender of the student.
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2000-01-01
 *                 description: Date of birth of the student.
 *               address:
 *                 type: string
 *                 example: "123 Main Street, Springfield"
 *                 description: Home address of the student.
 *               level:
 *                 type: integer
 *                 example: 2
 *                 description: Academic level of the student.
 *               cgpa:
 *                 type: number
 *                 format: float
 *                 example: 3.75
 *                 description: Current CGPA of the student.
 *     responses:
 *       201:
 *         description: Student successfully created.
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
 *                   example: "STUDENT created successfully!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       example: "64a86f0b5e6b123c456789ab"
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *       400:
 *         description: Bad request. Validation errors or duplicate student.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Student already exists!"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error."
 */
router.post(
    "/",
    checkSchema(signupStudentValidationScheme),
    StudentController.createStudent
);

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: Retrieve all students
 *     security:
 *       - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by student name
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filter by gender
 *       - in: query
 *         name: level
 *         schema:
 *           type: number
 *         description: Filter by level
 *       - in: query
 *         name: cgpa
 *         schema:
 *           type: string
 *         description: Filter by CGPA (e.g., 'gte:3.5' or 'lte:2.0')
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 currentPage:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *                 count:
 *                   type: number
 *                 size:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       level:
 *                         type: number
 *                       cgpa:
 *                         type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", StudentController.getAllStudents);

/**
 * @swagger
 * /api/v1/students/{studentId}:
 *   delete:
 *     summary: Delete a student
 *     security:
 *       - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       400:
 *         description: Invalid student ID
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:studentId", StudentController.deleteStudent);

export { router as studentRouter };
