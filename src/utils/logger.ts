import { createLogger, format, transports } from "winston";
import { NextFunction, Request, Response } from "express";

// Winston logger configuration
export const logger = createLogger({
    level: "http",
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `[${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [new transports.Console()],
});

// Middleware to log HTTP requests
export const requestLogMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now();

    // After response is finished, log the details
    res.on("finish", () => {
        const duration = Date.now() - start;

        logger.http(
            `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
        );
    });

    next();
};
