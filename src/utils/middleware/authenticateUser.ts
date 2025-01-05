import 'dotenv/config'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { DecodedToken } from '../types/jwt'

export const checkJwtToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(' ')[1] // Split 'Bearer <token>'

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Authorization credentials ware not provided!',
        })
        return
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Authorization credentials ware not provided!',
            })
        }

        req.user = decoded as DecodedToken
        next()
    })
}
