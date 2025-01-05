import jwt from 'jsonwebtoken'
import 'dotenv/config'

export const mockUsers = [
    {
        _id: 1,
        name: 'Max Stevenson',
        password: 'p@$$wOrd123',
        email: 'max@gmail.com',
        role: 'student',
        phone: '0247584843',
        gender: 'male',
        address: 'Labadi',
        dateOfBirth: '2001-05-12',
    },
    {
        _id: 2,
        name: 'Ellen Bass',
        password: 'p@$$wOrd123',
        email: 'bassellen@gmail.com',
        role: 'student',
        phone: '0474638398',
        gender: 'female',
        address: 'Amamoma',
        dateOfBirth: '1999-07-23',
    },
    {
        id: 3,
        name: 'Mario Reynolds',
        password: 'p@$$wOrd123',
        email: 'marioreynolds05@gmail.com',
        role: 'student',
        phone: '0256849272',
        gender: 'male',
        address: 'Spintex',
        dateOfBirth: '2003-12-30',
    },
    {
        id: 4,
        name: 'Floyd Morales',
        password: 'p@$$wOrd123',
        email: 'moralesfloyed@gmail.com',
        role: 'instructor',
        phone: '0558362849',
        gender: 'male',
        address: 'East Legon',
        dateOfBirth: '1996-01-01',
    },
    {
        id: 5,
        name: 'Sophia McDonald',
        password: 'p@$$wOrd123',
        email: 'sophiamacdonald@gmail.com',
        role: 'instructor',
        phone: '0338464738',
        gender: 'female',
        address: 'American House',
        dateOfBirth: '1899-04-11',
    },
]

export const user1 = {
    _id: 3,
    name: 'Mario Reynolds',
    password: 'p@$$wOrd123',
    email: 'marioreynolds05@gmail.com',
    role: 'student',
    phone: '0256849272',
    gender: 'male',
    address: 'Spintex',
    dateOfBirth: new Date(2003 - 12 - 30),
}

export const mockStudents = [
    { _id: 1, user: 1, level: 100, cgpa: 4.0, courses: [1, 2] },
    { _id: 2, user: 2, level: 200, cgpa: 3.5, courses: [1, 3] },
    { _id: 3, user: 3, level: 300, cgpa: 2.9, courses: [2, 4] },
]

export const student1 = {
    _id: 1,
    user: 1,
    level: 100,
    cgpa: 4.0,
    courses: [1, 2],
}

export const student2 = {
    _id: 2,
    user: 2,
    level: 200,
    cgpa: 3.5,
    courses: [1, 3],
}

export const newStudent1 = {
    name: 'Adrian Keller',
    email: 'watchmker@gmail.com',
    password: 'p@$$wOrd123',
    phone: '(201) 724-3216',
    gender: 'female',
    address: 'Kigali',
    dateOfBirth: '2001-05-12',
    level: 100,
    cgpa: 4.0,
}

export const newInstructorUser1 = {
    name: 'John Doe',
    password: 'p@$$wOrd123',
    email: 'najiweh431@myweblaw.com',
    phone: '0247584843',
    gender: 'male',
    address: 'Labadi',
    dateOfBirth: '2001-05-12',
    salary: 50_000.0,
    coursesTaught: [],
}

export const newInstructorUser2 = {
    name: 'Dean Gutierrez',
    password: 'p@$$wOrd123',
    email: 'fispugiydi@gufum.com',
    phone: '0536284593',
    gender: 'male',
    address: 'Kumasi',
    dateOfBirth: '2005-03-23',
    salary: 80_000.0,
    coursesTaught: [],
}

export const instructors = [
    {
        _id: 1,
        user: { name: 'Mario Reynolds', email: 'marioreynolds05@gmail.com' },
        department: 'Computer Science',
        coursesTaught: [],
        salary: 50_000.0,
    },
    {
        _id: 2,
        user: { name: 'Sophia McDonald', email: 'sophiamacdonald@gmail.com' },
        department: 'Communication and Professionalism',
        coursesTaught: [],
        salary: 70_000.0,
    },
]

export const instructor1 = {
    _id: 1,
    user: 4,
    department: 'Computer Science',
    coursesTaught: [],
    salary: 50_000.0,
}

export const testCourses = [
    {
        name: 'Introduction to Computer Science',
        code: 'CSC101',
        description:
            'An introductory course in computer science covering basic programming and problem-solving techniques.',
        credits: 3,
        semester: 'First',
        department: 'Computer Science',
    },
    {
        name: 'Calculus I',
        code: 'MTH101',
        description:
            'A foundational mathematics course focusing on limits, derivatives, and integrals.',
        credits: 3,
        semester: 'First',
        department: 'Mathematics',
    },
    {
        name: 'General Chemistry',
        code: 'CHM101',
        description:
            'An introductory chemistry course covering atomic structure, chemical reactions, and laboratory techniques.',
        credits: 2,
        semester: 'Second',
        department: 'Chemistry',
    },
    {
        name: 'Principles of Economics',
        code: 'ECO101',
        description:
            'An overview of microeconomic and macroeconomic principles, including market behavior and economic policies.',
        credits: 3,
        semester: 'Second',
        department: 'Economics',
    },
    {
        name: 'Introduction to Psychology',
        code: 'PSY101',
        description:
            'An introductory course exploring key psychological concepts and research methods.',
        credits: 2,
        semester: 'First',
        department: 'Psychology',
    },
]

type UserRole = 'student' | 'instructor'

export const generateTestToken = ({ role }: { role: UserRole | undefined }) => {
    const payload = { id: 'testUser', type: 'refreshToken', role }
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '1d',
    })
}
