const baseValidationSchema = {
    name: {
        optional: true,
        isLength: {
            errorMessage: "Course name cannot be empty",
            options: { min: 1 },
        },
    },
    code: {
        optional: true,
        isLength: {
            errorMessage: "Course code cannot be empty",
            options: { min: 1 },
        },
    },
    credits: {
        optional: true,
        isInt: {
            errorMessage:
                "Number of credits should be an integer between 1 and 3",
            options: { min: 1, max: 3 },
        },
    },
    semester: {
        optional: true,
        isIn: {
            options: [["First", "Second"]],
            errorMessage: "Semester must be one of First or Second",
        },
    },
    department: {
        optional: true,
        isLength: {
            errorMessage: "Department cannot be empty",
            options: { min: 1 },
        },
    },
};

export const courseCreationValidationSchema = {
    ...baseValidationSchema,
    name: { ...baseValidationSchema.name, optional: false }, // Required for creation
    code: { ...baseValidationSchema.code, optional: false },
    credits: { ...baseValidationSchema.credits, optional: false },
    semester: { ...baseValidationSchema.semester, optional: false },
    department: { ...baseValidationSchema.department, optional: false },
};

export const courseUpdationValidationSchema = {
    ...baseValidationSchema, // All fields remain optional
};
