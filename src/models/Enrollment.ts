import { models, model, Schema } from "mongoose";

const EnrollmentSchema = new Schema(
    {
        student: {
            type: Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
    },
    { timestamps: true }
);

// to ensure students can't be enrolled in the same course more than once
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = models.Enrollment || model("Enrollment", EnrollmentSchema);
export default Enrollment;
