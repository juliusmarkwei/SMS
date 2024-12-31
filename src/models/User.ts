import { models, model, Schema } from "mongoose";
import { IUser } from "../utils/types/user";

const UserSchema: Schema<IUser> = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["student", "instructor"],
            default: "student",
            required: true,
        },
        phone: {
            type: String,
            required: false,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        address: {
            type: String,
            required: false,
        },
        resetToken: {
            type: String,
            required: false,
        },
        resetTokenExpiry: {
            type: Date,
            required: false,
        },
    },
    { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
