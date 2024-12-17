import "dotenv/config";
import express, { json, urlencoded } from "express";
import path from "path";
import { logger, requestLogMiddleware } from "./utils/logger";
import { authRouter } from "@/routes/auth";
import cors from "cors";
import { checkJwtToken } from "@/utils/middleware/authenticateUser";
import { studentRouter } from "./routes/students";
import { courseRouter } from "./routes/courses";
import { enrollmentRouter } from "./routes/enrollments";
import { instructorRouter } from "./routes/instructors";
import { studentRateLimiter } from "./utils/middleware/rateLimitStudent";
import { Router } from "express";
import { sortStudentRouter, sortCourseRouter } from "./routes/sort";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "./utils/swaggerConfig";

const app = express();
const PORT = 3000;

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(requestLogMiddleware);

const options = {
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(options));

// static files
app.use(express.static(path.resolve(__dirname, "..", "public")));

// Parent Router for /api/v1
const apiRouter = Router();

apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

apiRouter.use("/auth", authRouter);
apiRouter.use(checkJwtToken, studentRateLimiter);
apiRouter.use("/students", studentRouter);
apiRouter.use("/instructors", instructorRouter);
apiRouter.use("/courses", courseRouter);
apiRouter.use("/enrollments", enrollmentRouter);
apiRouter.use("/sort/students", sortStudentRouter);
apiRouter.use("/sort/courses", sortCourseRouter);

// Use the parent router
app.use("/api/v1", apiRouter);

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});
