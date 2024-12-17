import { Router } from "express";
import { isInstructor } from "@/utils/middleware/isInstructor";
import CourseController from "@/controllers/courses";
import {
    courseCreationValidationSchema,
    courseUpdationValidationSchema,
} from "@/utils/middleware/validators/course";
import { checkSchema } from "express-validator";

const router = Router();

router.get("/", CourseController.getAllCourses);
router.get("/:courseCode", CourseController.getCourse);

router.use(isInstructor);
router.post(
    "/",
    checkSchema(courseCreationValidationSchema),
    CourseController.createCourse
);
router.put(
    "/:courseCode",
    checkSchema(courseUpdationValidationSchema),
    CourseController.updateCourse
);
router.delete("/:courseCode", CourseController.deleteCourse);

export { router as courseRouter };
