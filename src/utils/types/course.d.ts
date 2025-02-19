import { Document } from "mongoose";

export interface ICourse extends Document {
    name: string;
    code: string;
    description?: string;
    credits: number;
    semester: "First" | "Second";
    department: string;
    createdAt?: Date;
    updatedAt?: Date;
}
