import { models, model, Schema } from "mongoose";

const StudentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        level: {
            type: Number,
            default: 0,
        },
        cgpa: {
            type: Number,
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
