import { ICourse } from "@/utils/types/course";
import { Schema, model, models } from "mongoose";

const CourseSchema: Schema<ICourse> = new Schema(
    {
        name: {
            type: String,
            required: [true, "Course name is required"],
            trim: true,
            unique: true,
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
            max: 3,
        },
        semester: {
            type: String,
            required: [true, "Semester is required"],
            enum: ["Spring", "Summer", "Fall", "Winter"],
        },
        department: {
            type: String,
            required: [true, "Department is required"],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Course = models.Course || model("Course", CourseSchema);

export default Course;
