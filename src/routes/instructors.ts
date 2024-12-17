import { Router } from "express";
import { isInstructor } from "@/utils/middleware/isInstructor";
import InstructorController from "@/controllers/instructor";
import { signupInstructorValidationScheme } from "@/utils/middleware/validators/instructor";
import { updateInstructorValidationScheme } from "@/utils/middleware/validators/instructor";
import { checkSchema } from "express-validator";
import { preprocessCourses } from "@/utils/middleware/processCourses";

const router = Router();

router.use(isInstructor);
router.post(
    "/",
    preprocessCourses,
    checkSchema(signupInstructorValidationScheme),
    InstructorController.createInstructor
);
router.get("/", InstructorController.getAllInstructors);
router.get("/:instructorId", InstructorController.getInstructorById);
router.put(
    "/:instructorId",
    preprocessCourses,
    checkSchema(updateInstructorValidationScheme),
    InstructorController.updateInstructor
);
router.delete("/:instructorId", InstructorController.deleteInstructor);

export { router as instructorRouter };
