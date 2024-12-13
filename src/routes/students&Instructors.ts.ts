import { Router } from "express";
import { checkSchema } from "express-validator";
import StudentInstructorController from "@/controllers/students&Instructors";
import { checkJwtToken } from "@/utils/middleware/authenticateUser";
import { isInstructor } from "@/utils/middleware/isInstructor";
import {
    signupValidationScheme,
    studentUpdateValidationScheme,
} from "@/utils/middleware/validators/auth";

const router = Router();

// authenticated students & instructoes routes
router.get("/:studentId", StudentInstructorController.singleStudent);
router.put(
    "/:studentId",
    checkSchema(studentUpdateValidationScheme),
    StudentInstructorController.updateSingleStudent
);

// instructors only routes
router.use(isInstructor);
router.post(
    "/",
    checkSchema(signupValidationScheme),
    StudentInstructorController.createStudent
);
router.get("/", StudentInstructorController.getAllStudents);
router.delete("/:studentId", StudentInstructorController.deleteStudent);

// router.post(
//     "/instructors",
//     checkSchema(signupValidationScheme),
//     StudentInstructorController.createInstructor
// );
// router.get("/instructors", StudentInstructorController.getInstructors);

export { router as studentInstructorRouter };
