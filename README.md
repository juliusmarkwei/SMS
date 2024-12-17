# School Management System API

## Overview

This is a robust, scalable web application designed to digitize and streamline school administrative processes. The application focuses on comprehensive data management, complex sorting mechanisms, and efficient API design, supporting entities like **Student**, **Course**, **Instructor**, and **Enrollment**.

### Features

-   **Student Management**: CRUD operations for managing student data.
-   **Course Management**: CRUD operations for managing course offerings.
-   **Enrollment Management**: Enroll students in courses and manage their course enrollment.
-   **Sorting Endpoints**: Various sorting algorithms applied to student and course data.
-   **JWT Authentication**: Secure user authentication with token-based login.
-   **Advanced Filtering**: Dynamic query filters, such as `cgpa=gte:2.8`, for refined searches.
-   **Caching**: Dynamic key-based caching mechanism with a 1-minute expiration for optimized performance.
-   **CORS Configuration**: Initially restricted to specific applications, now configured to accept requests from all origins.

---

## Project Structure

```
.
├── package.json
├── package-lock.json
├── README.md
├── src
│   ├── controllers
│   │   ├── auth.ts          # Handles authentication routes like login and password reset.
│   │   ├── courses.ts       # Manages course-related operations.
│   │   ├── enrollments.ts   # Handles student enrollments in courses.
│   │   ├── instructor.ts    # Manages instructor-specific actions.
│   │   ├── sort.ts          # Provides sorting functionality for students and courses.
│   │   └── students.ts      # Manages student-related CRUD operations.
│   ├── logs
│   │   └── http.log         # Stores HTTP request and response logs.
│   ├── models
│   │   ├── Course.ts        # Schema and model for courses.
│   │   ├── Enrollment.ts    # Schema and model for course enrollments.
│   │   ├── Instructor.ts    # Schema for instructors extending from the User model.
│   │   ├── Student.ts       # Schema for students extending from the User model.
│   │   └── User.ts          # Parent model storing shared user information.
│   ├── routes
│   │   ├── auth.ts          # Defines routes for authentication.
│   │   ├── courses.ts       # Defines routes for course operations.
│   │   ├── enrollments.ts   # Defines routes for enrollment actions.
│   │   ├── instructors.ts   # Defines routes for instructor management.
│   │   ├── sort.ts          # Defines routes for sorting functionalities.
│   │   └── students.ts      # Defines routes for student management.
│   ├── script.ts            # Entry point for utility scripts or setup tasks.
│   └── utils
│       ├── cache.ts         # Caching mechanism for improved performance.
│       ├── dbConfig.ts      # Database configuration file.
│       ├── enums.ts         # Contains enumerations for constants.
│       ├── logger.ts        # Logger setup using Winston.
│       ├── mailer.ts        # Utility for sending emails.
│       ├── middleware
│       │   ├── authenticateUser.ts   # JWT-based user authentication middleware.
│       │   ├── handleReqBodyErrors.ts # Validates and handles request body errors.
│       │   ├── isInstructor.ts       # Middleware to check instructor roles.
│       │   ├── processCourses.ts     # Middleware for processing course data.
│       │   ├── rateLimitStudent.ts   # Rate-limiting middleware for students.
│       │   └── validators
│       │       ├── auth.ts           # Validation for authentication requests.
│       │       ├── course.ts         # Validation for course-related requests.
│       │       ├── instructor.ts     # Validation for instructor actions.
│       │       └── student.ts        # Validation for student-related actions.
│       ├── sortingTechniques.ts      # Implementation of sorting algorithms.
│       ├── swaggerConfig.ts          # Swagger API documentation configuration.
│       └── types
│           ├── course.d.ts           # Type definitions for course data.
│           ├── instructor.d.ts       # Type definitions for instructor data.
│           ├── jwt.d.ts              # Type definitions for JWT tokens.
│           ├── student.d.ts          # Type definitions for student data.
│           └── user.d.ts             # Type definitions for shared user data.
└── tsconfig.json                     # TypeScript configuration file.
```

---

## Features

### User Entities

#### 1. **Student**

-   Students have limited access to their own personal information such as enrolled courses.

#### 2. **Instructor**

-   Instructors have full system and management capabilities, including student account creation, course creation, etc.

### Authentication

-   **JWT-based Authentication**: All users must log in using email/password credentials to receive a JWT token for secure access to protected routes.

---

## Advanced Functionalities

-   **Caching**: Implements a dynamic key-based caching system with a 1-minute expiration.
-   **Advanced Filtering**: Supports query filters like `cgpa=gte:2.8` for precise data retrieval.
-   **CORS Configuration**: Initially restricted to specific applications, now open to all origins for better accessibility.

---

## API Routes

### Public Routes

-   **POST** `/api/v1/auth/login`: Log in and retrieve accessToken and refreshToken.
-   **POST** `/api/v1/auth/forgot-password`: Request a password reset link.
-   **POST** `/api/v1/auth/password-reset`: Send the token received in your mail and your new password.
-   **POST** `/api/v1/auth/refresh-token`: Send the refreshToken in request body to get recieve a new accessToken.

### Protected Routes

#### Student Management

-   **GET** `/students`: Retrieve all students. (Accessible to instructors only)
-   **GET** `/students/{id}`: Retrieve specific student details. (Instructors and self-access for students)
-   **POST** `/students`: Create a new student record. (Instructors only)
-   **PUT** `/students/{id}`: Update student information. (Instructors and self-access for students)
-   **DELETE** `/students/{id}`: Remove a student from the system. (Instructors only)

#### Course Management

-   **GET** `/courses`: List all courses. (Accessible to all authenticated users)
-   **GET** `/courses/{courseCode}`: Retrieve specific course details. (Accessible to all authenticated users)
-   **POST** `/courses`: Create a new course. (Instructors only)
-   **PUT** `/courses/{courseCode}`: Update course information. (Instructors only)
-   **DELETE** `/courses/{courseCode}`: Remove a course. (Instructors only)

#### Enrollment Management

-   **POST** `/enrollments`: Enroll a student in a course. (Instructors only, self-enrollment for students with restrictions)
-   **GET** `/enrollments/student/{studentId}`: Retrieve all courses for a student. (Self-access for students)
-   **GET** `/enrollments/course/{courseCode}`: Retrieve all students enrolled in a course. (Instructors only)
-   **DELETE** `/enrollments/{enrollmentId}`: Cancel an enrollment. (Instructors only, self-cancellation for students)

#### Sorting Endpoints

-   **GET** `/sort/students`: Sort student data by different fields (e.g., GPA, grade, etc.).
-   **GET** `/sort/courses`: Sort course listings based on various criteria (e.g., course duration, name, etc.).

#### Instructors Management (Instructors-specific only)

-   **GET** `/instructors`: Retrieve all instructors.
-   **GET** `/instructors/{id}`: Retrieve specific instructors details.
-   **POST** `/instructors`: Create a new student record.
-   **PUT** `/instructors/{id}`: Update instructors information.
-   **DELETE** `/instructors/{id}`: Remove a instructors from the system.

---

## Advanced Requirements

-   **Comprehensive Input Validation**: Middleware to validate inputs and ensure proper data formatting.
-   **Error Handling**: Middleware for handling errors.
-   **Logging**: Use of Winston to log system activities.
-   **Pagination**: Implemented pagination for list endpoints (students, courses).
-   **API Documentation**: Swagger-generated documentation for all endpoints.

---

## Performance Considerations

-   **Caching**: Caching strategies for commonly accessed data.
-   **Optimized Database Queries**: Ensuring fast data retrieval with optimized queries.
-   **Indexing**: Indexing frequently accessed fields for better performance.

---

## Response Example

#### Sorting Algorithm Endpoint

**GET** `/sort/students`

Request query-parameter:

```json
{
    "sortBy": "cgpa",
    "order": "asc"
}
```

Response:

```json
{
    "success": true,
    "count": 2,
    "page": 1,
    "limit": 2,
    "data": [
        { "_id": 1, "name": "Julius Markwei", "cgpa": 3.5,... },
        { "_id": 2, "name": "Sherlock Holmes", "cgpa": 3.8,... }
    ]
}
```

---

## Swagger API Documentation

Below is a preview of the browsable API documentation using Swagger.

![Swagger API Documentation](./public/Screenshot1.png)
![Swagger API Documentation](./public/Screenshot2.png)

---

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/julius-amt/SMS.git
    ```

2.  Move into the project directory

    ```bash
    cd SMS/
    ```

3.  Install dependencies:

    ```bash
    npm install
    ```

4.  Configure environment variables:

        - Create a `.env` file in the root directory.
        - Add required environment variables like database credentials, JWT secret, etc.
        - Content of `.env` file:
            * MONGODB_URI=MONGODB_URI
            * JWT_SECRET=JWT_SECRET
            * EMAIL_HOST=EMAIL_HOST
            * EMAIL_PORT=EMAIL_PORT
            * EMAIL_SECURE=EMAIL_SECURE
            * EMAIL_USER=EMAIL_USER
            * EMAIL_PASS=EMAIL_PASS
            * BASE_URL=BASE_URL

5.  Start the application:
    ```bash
    npm run dev
    ```

---

## Technologies Used

-   **Node.js**: JavaScript runtime for building scalable applications.
-   **Express.js**: Web framework for building APIs.
-   **MongoDB**: NoSQL database for storing application data.
-   **Mongoose**: ORM for interacting with MongoDB.
-   **JWT**: Token-based authentication for secure access.
-   **Winston**: Logging library for logging system activities.
-   **Swagger**: API documentation tool.
-   **TypeScript**: Typed superset of JavaScript for improved development experience.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
