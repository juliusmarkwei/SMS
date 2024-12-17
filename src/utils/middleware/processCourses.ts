import { Request, Response, NextFunction } from "express";

export const preprocessCourses = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.body.courses && typeof req.body.courses === "string") {
        try {
            req.body.courses = JSON.parse(req.body.courses);
        } catch (e) {
            res.status(400).json({
                success: false,
                message: "Courses should be a valid array.",
            });
            return;
        }
    }
    next();
};
