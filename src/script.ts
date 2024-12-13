import "dotenv/config";
import express, { json, urlencoded } from "express";
import path from "path";
import { logger, requestLogMiddleware } from "./utils/logger";
import { authRouter } from "@/routes/auth";
import cors from "cors";
import { checkJwtToken } from "@/utils/middleware/authenticateUser";
import { studentInstructorRouter } from "./routes/students&Instructors.ts";

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

app.use("/api/v1/auth/", authRouter);

app.use(checkJwtToken);
app.use("/api/v1/students/", studentInstructorRouter);

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});
