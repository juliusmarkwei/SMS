import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

export const studentRateLimiter = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req?.user as { role: string; id: string } | null;

    if (user && user.role === "student") {
        return rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 15,
            message: {
                success: false,
                error: "Too many requests from students. Please try again later.",
            },
            keyGenerator: (req) => {
                return req.user!.id;
            },
        })(req, res, next);
    }

    next();
};
