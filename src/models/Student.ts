import { models, model, Schema, Types } from "mongoose";
import { IStudent } from "../utils/types/student";

const StudentSchema: Schema<IStudent> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        level: {
            type: Number,
            default: 100,
        },
        cgpa: {
            type: Types.Decimal128,
            default: 0,
        },
        courses: [
            {
                type: Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
    },
    { timestamps: true }
);

const Student = models.Student || model("Student", StudentSchema);
export default Student;
