import { Request, Response } from "express";

class _404Controller {
    static async index(req: Request, res: Response) {
        res.status(404).json({
            success: false,
            message: `The requested endpoint/resource at '${req.originalUrl}' does not exist. Check out our docs at /api/v1/docs to learn more`,
        });
    }
}

export default _404Controller;
