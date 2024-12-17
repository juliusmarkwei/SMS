import { Router } from "express";
import { checkSchema } from "express-validator";
import StudentController from "@/controllers/students";
import { isInstructor } from "@/utils/middleware/isInstructor";
import {
    signupValidationScheme,
    studentUpdateValidationScheme,
} from "@/utils/middleware/validators/auth";

const router = Router();

// authenticated students & instructoes routes
router.get("/:studentId", StudentController.singleStudent);
router.put(
    "/:studentId",
    checkSchema(studentUpdateValidationScheme),
    StudentController.updateSingleStudent
);

// instructors only routes
router.use(isInstructor);
router.post(
    "/",
    checkSchema(signupValidationScheme),
    StudentController.createStudent
);
router.get("/", StudentController.getAllStudents);
router.delete("/:studentId", StudentController.deleteStudent);

export { router as studentRouter };
