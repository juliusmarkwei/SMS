export const loginValidationScheme = {
    email: {
        notEmpty: true,
        errorMessage: 'Email is required',
        isEmail: {
            errorMessage: 'Invalid email',
        },
    },
    password: {
        notEmpty: true,
        errorMessage: 'Password is required',
        isLength: {
            options: { min: 6 },
            errorMessage: 'Password should be at least 6 chars',
        },
    },
}

export const forgotPasswordValidationSchema = {
    email: {
        notEmpty: {
            errorMessage: 'Email is required',
        },
        isEmail: {
            errorMessage: 'Invalid email',
        },
    },
}

export const resetPasswordValidationSchema = {
    password: {
        notEmpty: {
            errorMessage: 'Password is required',
        },
        isString: {
            errorMessage: 'Password should be a string',
        },
        isLength: {
            options: { min: 6 },
            errorMessage: 'Password should be at least 6 chars long',
        },
    },
    confirmPassword: {
        notEmpty: {
            errorMessage: 'Confirm-Password is required',
        },
        isString: {
            errorMessage: 'Confirm-Password should be a string',
        },
        isLength: {
            options: { min: 6 },
            errorMessage: 'Confirm-Password should be at least 6 chars long',
        },
    },
}
