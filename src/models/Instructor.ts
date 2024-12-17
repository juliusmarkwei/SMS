import { models, model, Schema } from "mongoose";
import { IInstructor } from "@/utils/types/instructor";

const InstructorSchema: Schema<IInstructor> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        department: {
            type: String,
            required: false,
        },
        coursesTaught: [
            {
                type: Schema.Types.ObjectId,
                ref: "Course",
                required: false,
            },
        ],
        salary: {
            type: Number,
            required: false,
        },
    },
    { timestamps: true }
);

const Instructor = models.Instructor || model("Instructor", InstructorSchema);
export default Instructor;
