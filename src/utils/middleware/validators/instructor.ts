export const signupInstructorValidationScheme = {
    name: {
        notEmpty: {
            errorMessage: "Name is required",
        },
    },
    email: {
        notEmpty: {
            errorMessage: "Email is required",
        },
        isEmail: {
            errorMessage: "Invalid email",
        },
    },
    password: {
        notEmpty: {
            errorMessage: "Password is required",
        },
        isLength: {
            options: { min: 6 },
            errorMessage: "Password should be at least 6 characters",
        },
    },
    phone: {
        notEmpty: {
            errorMessage: "Phone number is required",
        },
        isMobilePhone: {
            errorMessage: "Invalid phone number",
        },
    },
    gender: {
        notEmpty: {
            errorMessage: "Gender is required",
        },
        isIn: {
            options: [["male", "female"]],
            errorMessage: "Gender should be either male or female",
        },
    },
    dateOfBirth: {
        notEmpty: {
            errorMessage: "Date of birth is required",
        },
        isDate: {
            errorMessage: "Invalid date of birth. Use yyyy-mm-dd format",
        },
    },
    address: {
        optional: true,
    },
    department: {
        optional: true,
    },
    salary: {
        optional: true,
        isFloat: {
            options: { min: 0 },
            errorMessage: "Salary should be a float greater than or equal to 0",
        },
    },
    courses: {
        optional: true,
        isArray: {
            errorMessage:
                "Courses should be an array. Format [courseId, courseId2,...]",
        },
    },
};

export const updateInstructorValidationScheme = {
    ...(({ password, email, ...rest }) => rest)(
        signupInstructorValidationScheme
    ),
    name: {
        ...signupInstructorValidationScheme.name,
        optional: true,
    },
    phone: {
        ...signupInstructorValidationScheme.phone,
        optional: true,
    },
    gender: {
        ...signupInstructorValidationScheme.gender,
        optional: true,
    },
    dateOfBirth: {
        ...signupInstructorValidationScheme.dateOfBirth,
        optional: true,
    },
    address: {
        ...signupInstructorValidationScheme.address,
        optional: true,
    },
};
