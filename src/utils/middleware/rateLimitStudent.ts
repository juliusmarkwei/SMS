import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

const studentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    message: {
        success: false,
        error: "Too many requests from students. Please try again later.",
    },

    keyGenerator: (req: Request) => {
        const user = req?.user as { role: string; id: string };
        return user.id;
    },
});

export const studentRateLimiter = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = req?.user as { role: string; id: string } | null;

    if (user && user.role === "student") {
        return studentLimiter(req, res, next);
    }

    next();
};
