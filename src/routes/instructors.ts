import { Router } from "express";
import { isInstructor } from "../utils/middleware/isInstructor";
import InstructorController from "../controllers/instructor";
import { signupInstructorValidationScheme } from "../utils/middleware/validators/instructor";
import { updateInstructorValidationScheme } from "../utils/middleware/validators/instructor";
import { checkSchema } from "express-validator";
import { preprocessCourses } from "../utils/middleware/processCourses";

const router = Router();

router.use(isInstructor);

/**
 * @swagger
 * tags:
 *   name: Instructors
 *   description: API endpoints for managing instructors
 */

/**
 * @swagger
 * /api/v1/instructors:
 *   post:
 *     summary: Create a new instructor
 *     security:
 *       - bearerAuth: []
 *     tags: [Instructors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               department:
 *                 type: string
 *               salary:
 *                 type: number
 *               courses:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Instructor created successfully
 *       400:
 *         description: Invalid input or instructor already exists
 *       500:
 *         description: Internal server error
 */
router.post(
    "/",
    preprocessCourses,
    checkSchema(signupInstructorValidationScheme),
    InstructorController.createInstructor
);

/**
 * @swagger
 * /api/v1/instructors:
 *   get:
 *     summary: Get all instructors
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error
 */
router.get("/", InstructorController.getAllInstructors);

/**
 * @swagger
 * /api/v1/instructors/{instructorId}:
 *   get:
 *     summary: Get instructor by ID
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Instructor ID
 *     responses:
 *       200:
 *         description: Instructor details
 *       404:
 *         description: Instructor not found
 *       500:
 *         description: Internal server error
 */
router.get("/:instructorId", InstructorController.getInstructorById);

/**
 * @swagger
 * /api/v1/instructors/{instructorId}:
 *   put:
 *     summary: Update an instructor's details
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Instructor ID
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
 *               gender:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               department:
 *                 type: string
 *               salary:
 *                 type: number
 *               courses:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Instructor updated successfully
 *       400:
 *         description: Invalid input or courses
 *       404:
 *         description: Instructor not found
 *       500:
 *         description: Internal server error
 */
router.put(
    "/:instructorId",
    preprocessCourses,
    checkSchema(updateInstructorValidationScheme),
    InstructorController.updateInstructor
);

/**
 * @swagger
 * /api/v1/instructors/{instructorId}:
 *   delete:
 *     summary: Delete an instructor
 *     tags: [Instructors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Instructor ID
 *     responses:
 *       200:
 *         description: Instructor deleted successfully
 *       404:
 *         description: Instructor not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:instructorId", InstructorController.deleteInstructor);

export { router as instructorRouter };
