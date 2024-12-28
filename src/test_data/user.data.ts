export const mockUsers = [
    {
        _id: 1,
        name: "Max Stevenson",
        password: "p@$$wOrd123",
        email: "max@gmail.com",
        role: "student",
        phone: "0247584843",
        gender: "male",
        address: "Labadi",
        dateOfBirth: "2001-05-12",
    },
    {
        _id: 2,
        name: "Ellen Bass",
        password: "p@$$wOrd123",
        email: "bassellen@gmail.com",
        role: "student",
        phone: "0474638398",
        gender: "female",
        address: "Amamoma",
        dateOfBirth: "1999-07-23",
    },
    {
        id: 3,
        name: "Mario Reynolds",
        password: "p@$$wOrd123",
        email: "marioreynolds05@gmail.com",
        role: "student",
        phone: "0256849272",
        gender: "male",
        address: "Spintex",
        dateOfBirth: "2003-12-30",
    },
    {
        id: 4,
        name: "Floyd Morales",
        password: "p@$$wOrd123",
        email: "moralesfloyed@gmail.com",
        role: "instructor",
        phone: "0558362849",
        gender: "male",
        address: "East Legon",
        dateOfBirth: "1996-01-01",
    },
    {
        id: 5,
        name: "Sophia McDonald",
        password: "p@$$wOrd123",
        email: "sophiamacdonald@gmail.com",
        role: "instructor",
        phone: "0338464738",
        gender: "femal",
        address: "American House",
        dateOfBirth: "1899-04-11",
    },
];

export const user1 = {
    _id: 3,
    name: "Mario Reynolds",
    password: "p@$$wOrd123",
    email: "marioreynolds05@gmail.com",
    role: "student",
    phone: "0256849272",
    gender: "male",
    address: "Spintex",
    dateOfBirth: new Date(2003 - 12 - 30),
};

export const mockStudents = [
    { _id: 1, user: 1, level: 100, cgpa: 4.0, courses: [1, 2] },
    { _id: 2, user: 2, level: 200, cgpa: 3.5, courses: [1, 3] },
    { _id: 3, user: 3, level: 300, cgpa: 2.9, courses: [2, 4] },
];

export const student1 = {
    _id: 1,
    user: 1,
    level: 100,
    cgpa: 4.0,
    courses: [1, 2],
};
export const student2 = {
    _id: 2,
    user: 2,
    level: 200,
    cgpa: 3.5,
    courses: [1, 3],
};

export const newStudent1 = {
    name: "Adrian Keller",
    email: "kelleradrian@kencu.rw",
    password: "p@$$wOrd123",
    phone: "(201) 724-3216",
    gender: "female",
    address: "Kigali",
    dateOfBirth: "2001-05-12",
    level: 100,
    cgpa: 4.0,
};

export const instructors = [
    {
        _id: 1,
        user: 4,
        dapartment: "Computer Science",
        coursesTaugth: [],
        salary: 50_000.0,
    },
    {
        _id: 2,
        user: 5,
        dapartment: "Communication and Professionalism",
        coursesTaugth: [],
        salary: 70_000.0,
    },
];

export const instructor1 = {
    _id: 1,
    user: 4,
    dapartment: "Computer Science",
    coursesTaugth: [],
    salary: 50_000.0,
};
