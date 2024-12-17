import { createLogger, format, transports } from "winston";
import { NextFunction, Request, Response } from "express";
import path from "path";

// Winston logger configuration
export const logger = createLogger({
    level: "http",
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        // Logs to the console
        new transports.Console(),

        // Logs to a file (http.log) in the logs directory
        new transports.File({
            filename: path.join(__dirname, "..", "logs", "http.log"),
            level: "http",
        }),
    ],
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
