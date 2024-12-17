export const signupStudentValidationScheme = {
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
            errorMessage:
                "Invalid date of birth. It should be of format yyyy-mm-dd",
        },
    },
    address: {
        optional: { options: { nullable: true } }, // Make address optional
        notEmpty: {
            errorMessage: "Address is required",
        },
    },
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
