import { Router } from "express";
import AuthController from "@/controllers/auth";
import { checkSchema } from "express-validator";
import {
    loginValidationScheme,
    forgotPasswordValidationSchema,
    resetPasswordValidationSchema,
} from "@/utils/middleware/validators/auth";

const router = Router();

// public routes
router.post("/login", checkSchema(loginValidationScheme), AuthController.login);
router.post(
    "/forgot-password",
    checkSchema(forgotPasswordValidationSchema),
    AuthController.forgotPassword
);
router.post(
    "/password-reset",
    checkSchema(resetPasswordValidationSchema),
    AuthController.resetPassword
);
router.post("/refresh-token", AuthController.refreshAccessToken);
export { router as authRouter };
