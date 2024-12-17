import { Router } from "express";
import AuthController from "@/controllers/auth";
import { checkSchema } from "express-validator";
import {
    loginValidationScheme,
    forgotPasswordValidationSchema,
    resetPasswordValidationSchema,
} from "@/utils/middleware/validators/auth";

const router = Router();

// Public routes

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags:
 *       - Auth
 *     description: Authenticates a user with their email and password and returns access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", checkSchema(loginValidationScheme), AuthController.login);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags:
 *       - Auth
 *     description: Sends a password reset link to the user's email if the email is registered.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Invalid email or user not found
 *       500:
 *         description: Server error
 */
router.post(
    "/forgot-password",
    checkSchema(forgotPasswordValidationSchema),
    AuthController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/password-reset:
 *   post:
 *     summary: Reset user password
 *     tags:
 *       - Auth
 *     description: Resets the user's password using the provided token and new password.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Password reset token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *             required:
 *               - password
 *               - confirmPassword
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *             required:
 *               - password
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password successfully reset
 *       400:
 *         description: Token is invalid, expired, or passwords do not match
 *       500:
 *         description: Server error
 */
router.post(
    "/password-reset",
    checkSchema(resetPasswordValidationSchema),
    AuthController.resetPassword
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Auth
 *     description: Refreshes the access token using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       400:
 *         description: Invalid or missing refresh token
 *       500:
 *         description: Server error
 */
router.post("/refresh-token", AuthController.refreshAccessToken);

export { router as authRouter };
