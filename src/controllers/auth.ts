import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { requestBodyErrorsInterrupt } from "@/utils/middleware/handleReqBodyErrors";
import bcrypt from "bcrypt";
import User from "@/models/User";
import { logger } from "@/utils/logger";
import jwt from "jsonwebtoken";
import { sendResetPasswordEmail } from "@/utils/mailer";
import connect from "@/utils/dbConfig";
import { AuthToken } from "@/utils/types/jwt";
import { Token } from "@/utils/enums";
import { IUser } from "@/utils/types/user";

connect();

class AuthController {
    static async login(req: Request, res: Response) {
        const error = requestBodyErrorsInterrupt(req, res);
        if (error) return;

        try {
            const { email, password } = matchedData(req);

            // Check if user exists and password is correct
            const user = await User.findOne({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                res.status(400).json({
                    success: false,
                    error: "Bad credentials!",
                });
                return;
            }

            // Generate tokens in parallel
            const [accessToken, refreshToken] = await Promise.all([
                jwt.sign(
                    {
                        id: user._id,
                        role: user.role,
                        type: "accessToken",
                    },
                    process.env.JWT_SECRET as string,
                    { expiresIn: "1d" }
                ),
                jwt.sign(
                    {
                        id: user._id,
                        role: user.role,
                        type: "refreshToken",
                    },
                    process.env.JWT_SECRET as string,
                    { expiresIn: "1w" }
                ),
            ]);

            res.status(200).json({
                success: true,
                accessToken,
                refreshToken,
            });
        } catch (err) {
            logger.error(err);
            res.status(500).json({
                success: false,
                error: "Internal server error.",
            });
        }
    }

    static async refreshAccessToken(req: Request, res: Response) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({
                success: false,
                error: "Refresh token is required!",
            });
            return;
        }

        try {
            // Verify the refresh token
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_SECRET as string
            ) as AuthToken;

            if (decoded.type !== Token.REFRESHTOKEN) {
                res.status(400).json({
                    success: false,
                    error: "Invalid refresh token!",
                });
                return;
            }

            // Find the user associated with the refresh token
            const user: IUser | null = await User.findById(decoded.id);
            if (!user) {
                res.status(400).json({
                    success: false,
                    error: "User not found or invalid refresh token!",
                });
                return;
            }

            // Generate new access token
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    role: user.role,
                    type: "accessToken",
                },
                process.env.JWT_SECRET as string,
                { expiresIn: "1d" }
            );

            res.json({ success: true, accessToken });
        } catch (error) {
            logger.error(error);
            res.status(500).json({
                success: false,
                error: "Internal server error.",
            });
        }
    }

    static async forgotPassword(req: Request, res: Response) {
        const errors = requestBodyErrorsInterrupt(req, res);
        if (errors) return;

        try {
            const { email } = matchedData(req);

            // Find the user by email
            const user: IUser | null = await User.findOne({ email });
            if (!user) {
                res.status(400).json({
                    error: "Check your email and try again!",
                    success: false,
                });
                return;
            }

            // Create a hash token and update the user with token and expiry
            const hashToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET as string,
                {
                    expiresIn: "1h",
                }
            );

            // Update user's reset token and expiry
            await User.findByIdAndUpdate(user._id, {
                resetToken: hashToken,
                resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            });

            // Send reset password email
            const emailResult = await sendResetPasswordEmail(user, hashToken);
            if (emailResult.success) {
                res.json({
                    success: true,
                    message: "Check your inbox for a password reset link",
                });
                return;
            }

            res.status(500).json({
                error: "Error sending email, please try again",
                success: false,
            });
        } catch (error: any) {
            logger.error(error);
            res.status(500).json({
                success: false,
                error: error.message || "Internal server error",
            });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        const errors = requestBodyErrorsInterrupt(req, res);
        if (errors) return;

        const { password, confirmPassword } = matchedData(req);

        // Check if passwords match
        if (password !== confirmPassword) {
            res.status(400).json({
                error: "Passwords do not match",
                success: false,
            });
            return;
        }

        // Verify token from query
        const { token } = req.query;
        if (!token) {
            res.status(400).json({
                error: "Token is required!",
                forgetPasswordURL: "/api/v1/auth/forgot-password",
                success: false,
            });
            return;
        }

        try {
            // Decode the token
            const decoded = jwt.verify(
                token as string,
                process.env.JWT_SECRET as string
            );
            if (!decoded) {
                res.status(400).json({
                    error: "Token is invalid!",
                    forgetPasswordURL: "/api/v1/auth/forgot-password",
                    success: false,
                });
                return;
            }

            // Find user with valid reset token
            const user: IUser | null = await User.findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: new Date() },
            });

            if (!user) {
                res.status(400).json({
                    error: "Token expired, request for a new link!",
                    forgetPasswordURL: "/api/v1/auth/forgot-password",
                    success: false,
                });
                return;
            }

            // Hash and update the password
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            // Save the new password and clear the reset token
            user.password = hashPassword;
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save();

            res.status(200).json({
                success: true,
                message: "Password successfully reset!",
            });
        } catch (error) {
            logger.error(error); // Catch any unexpected errors

            res.status(500).json({
                success: false,
                error: "Internal server error.",
            });
        }
    }
}

export default AuthController;
