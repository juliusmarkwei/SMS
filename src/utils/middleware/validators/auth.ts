export const signupValidationScheme = {
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
            errorMessage: "Password should be at least 6 chars",
        },
    },
    role: {
        optional: { options: { nullable: true } }, // Make role optional
        isIn: {
            options: [["student", "instructor"]],
            errorMessage: "Role should be either student or instructor",
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
            errorMessage: "Invalid date of birth",
        },
    },
    address: {
        optional: { options: { nullable: true } }, // Make address optional
        notEmpty: {
            errorMessage: "Address is required",
        },
    },

    // student specific
    level: {
        optional: { options: { nullable: true } }, // Make level optional
        isInt: {
            errorMessage: "Level should be an integer",
        },
    },
    cgpa: {
        optional: { options: { nullable: true } }, // Make cgpa optional
        isFloat: {
            errorMessage: "CGPA should be a float",
            option: { min: 0, max: 4 },
        },
    },

    // instructor specific
    department: {
        optional: { options: { nullable: true } }, // Make department optional
        notEmpty: {
            errorMessage: "Department is required",
        },
    },
    salary: {
        optional: { options: { nullable: true } }, // Make cgsalarypa optional
        isFloat: {
            errorMessage: "Salary should be a float",
        },
    },
};

export const loginValidationScheme = {
    email: {
        notEmpty: true,
        errorMessage: "Email is required",
        isEmail: {
            errorMessage: "Invalid email",
        },
    },
    password: {
        notEmpty: true,
        errorMessage: "Password is required",
        isLength: {
            options: { min: 6 },
            errorMessage: "Password should be at least 6 chars",
        },
    },
};

export const forgotPasswordValidationSchema = {
    email: {
        notEmpty: {
            errorMessage: "Email is required",
        },
        isEmail: {
            errorMessage: "Invalid email",
        },
    },
};

export const resetPasswordValidationSchema = {
    password: {
        notEmpty: {
            errorMessage: "Password is required",
        },
        isString: {
            errorMessage: "Password should be a string",
        },
        isLength: {
            options: { min: 6 },
            errorMessage: "Password should be at least 6 chars long",
        },
    },
    confirmPassword: {
        notEmpty: {
            errorMessage: "Confirm-Password is required",
        },
        isString: {
            errorMessage: "Confirm-Password should be a string",
        },
        isLength: {
            options: { min: 6 },
            errorMessage: "Confirm-Password should be at least 6 chars long",
        },
    },
};

export const studentUpdateValidationScheme = {
    name: {
        optional: true,
        notEmpty: {
            errorMessage: "Name cannot be empty",
        },
    },
    phone: {
        optional: true,
        isMobilePhone: {
            errorMessage: "Invalid phone number",
        },
    },
    gender: {
        optional: true,
        isIn: {
            options: [["male", "female"]],
            errorMessage: "Gender should be either male or female",
        },
    },
    dateOfBirth: {
        optional: true,
        isDate: {
            errorMessage: "Invalid date of birth",
        },
    },
    address: {
        optional: true,
        notEmpty: {
            errorMessage: "Address cannot be empty",
        },
    },
    level: {
        optional: true,
        isInt: {
            errorMessage: "Level should be an integer",
        },
    },
    cgpa: {
        optional: true,
        isFloat: {
            errorMessage: "CGPA should be a float",
            option: { min: 0, max: 4 },
        },
    },
};
