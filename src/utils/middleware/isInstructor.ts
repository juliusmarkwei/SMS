import { Request, Response, NextFunction } from 'express'
import { Role } from '../enums'

declare module 'express' {
    interface Request {
        user?: {
            role: string
            id: string
        }
    }
}

export const isInstructor = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const isAnInstructor = req?.user?.role === Role.INSTRUCTOR
    if (!isAnInstructor) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized!',
        })
        return
    }
    next()
}
