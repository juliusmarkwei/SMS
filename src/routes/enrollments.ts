import { Router } from "express";
import { isInstructor } from "@/utils/middleware/isInstructor";
import EnrollmentController from "@/controllers/enrollments";

const router = Router();

router.post("/", EnrollmentController.enrollStudentInCourse);
router.get(
    "/student/:studentId",
    EnrollmentController.getAllCoursesForAStudent
);
router.delete("/:enrollmentId", EnrollmentController.deleteEnrollment);

router.use(isInstructor);
router.get(
    "/course/:courseCode",
    EnrollmentController.getAllStudentsForACourse
);
router.get("/", EnrollmentController.getAllEnrollments);

export { router as enrollmentRouter };
