import { Document, Types } from "mongoose";

export interface IInstructor extends Document {
    user: Types.ObjectId;
    department: string;
    coursesTaught: Types.ObjectId[];
    salary?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
