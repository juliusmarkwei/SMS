import { Document, Types } from "mongoose";

export interface IStudent extends Document {
    user: Types.ObjectId;
    level: number;
    cgpa: Types.Decimal128;
    courses: Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}
