import { Schema, model, models, Types } from "mongoose";

const CourseSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Course name is required"],
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Course code is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            default: "No description provided",
            trim: true,
        },
        credits: {
            type: Number,
            required: [true, "Number of credits is required"],
            min: 1,
        },

        instructors: [
            {
                type: Types.ObjectId,
                ref: "Instructor",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Course = models.Course || model("Course", CourseSchema);

export default Course;
