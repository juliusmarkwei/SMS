import { Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    gender: string;
    address: string;
    avatar?: string;
    dateOfBirth: Date;
    resetToken?: string;
    resetTokenExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}
