import { models, model, Schema } from "mongoose";

const InstructorSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        department: {
            type: String,
            required: true,
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
