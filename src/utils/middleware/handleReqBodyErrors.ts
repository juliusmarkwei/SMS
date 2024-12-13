import { Response, Request } from "express";
import { validationResult } from "express-validator";

export const requestBodyErrorsInterrupt = (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Aggregate errors by field
        const extractedErrors: { [key: string]: string[] } = {};
        errors.array().forEach((err: any) => {
            const field = err.path;
            if (!extractedErrors[field]) {
                extractedErrors[field] = [];
            }
            // Avoid duplicate messages
            if (!extractedErrors[field].includes(err.path)) {
                extractedErrors[field].push(err.msg);
            }
        });

        res.status(400).json({ success: false, error: extractedErrors });
        return true;
    }
    return false;
};
