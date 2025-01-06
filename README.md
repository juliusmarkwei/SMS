# **Test Documentation for School Management System API**

## **1. Testing Scope and Requirements**

### **1.1 Test Coverage**

The test suite for the School Management System (SMS) API is designed to ensure the correct functionality and reliability of various system components. It comprehensively covers the following major areas:

-   **Authentication System**: Verifying user login, token generation, and validation, and ensuring proper role-based access control (RBAC).
-   **Student Management**: Testing CRUD operations for student data and validation mechanisms.
-   **Course Management**: Ensuring course creation, updating, and retrieval functions are working as expected.
-   **Enrollment Processes**: Testing the course enrollment workflow and verifying successful enrollment scenarios and validation for prerequisites and course capacities.
-   **Sorting and Filtering Mechanisms**: Ensuring that data is correctly sorted and filtered based on given parameters such as student grades, course names, or enrollment status.

### **1.2 Testing Approaches**

The testing approach follows a layered strategy to ensure all aspects of the system are tested thoroughly, employing different testing methodologies:

#### **A. Unit Testing**

-   **Objective**: To test individual components and methods in isolation.
-   **Test Focus**:
    -   **Authentication Logic**: Tests covering the login process, JWT token generation and validation.
    -   **Data Validation Mechanisms**: Ensuring the correct validation of user inputs, course data, and student records.
    -   **Method Behaviours**: Validating the correctness of helper functions and smaller isolated methods.
    -   **Edge Case Handling**: Tests ensuring edge cases such as invalid inputs or empty fields are handled gracefully.

#### **B. Integration Testing**

-   **Objective**: To validate interactions between different modules within the system.
-   **Test Scenarios**:
    -   **Course Enrollment**: Ensuring the correct interaction between the `Student` and `Course` models during enrollment, including capacity checks and prerequisite validation.
    -   **Data Persistence and Retrieval**: Verifying that data is correctly stored in the database and can be retrieved efficiently.
    -   **Role-Based Access Control**: Ensuring that the authentication system respects user roles such as `Admin`, `Instructor`, and `Student`.

#### **C. Performance Testing**

-   **Objective**: To evaluate the performance and efficiency of the API under load.
-   **Test Scenarios**:
    -   **API Response Times**: Testing the response time of endpoints to ensure they meet performance benchmarks.
    -   **Database Query Efficiency**: Ensuring that database queries execute within an acceptable timeframe, especially for complex joins and searches.
    -   **Sorting Algorithm Performance**: Evaluating how well the sorting and filtering mechanisms perform with large datasets.
    -   **Concurrent User Handling**: Stress testing the API to handle concurrent requests from multiple users.

#### **D. Security Testing**

-   **Objective**: To validate the security features of the application.
-   **Test Scenarios**:
    -   **JWT Token Generation and Validation**: Ensuring tokens are correctly generated, validated, and securely handled.
    -   **Access Control Restrictions**: Verifying that unauthorized access is prevented for non-admin users, ensuring role-based access works properly.
    -   **Input Validation and Sanitization**: Ensuring user inputs are properly sanitized to prevent SQL injections, XSS attacks, etc.
    -   **Protection Against Vulnerabilities**: Validating against common web vulnerabilities like CSRF and request forgery attacks.

#### **E. Mocking and Dependency Isolation**

-   **Objective**: To isolate external dependencies and simulate specific scenarios.
-   **Test Scenarios**:
    -   **Simulate External Dependencies**: Mocking services like email or third-party APIs to test specific interactions without relying on external services.
    -   **Control Test Environment**: Setting up controlled environments where inputs and responses can be fully managed.

## **2. Test Scenarios to Cover**

Each of the following test categories is designed to validate key areas of the API:

-   **Authentication Scenarios**: Testing login, token generation, token expiration, invalid login attempts, and user roles.
-   **Student Management Scenarios**: Verifying student creation, updating, retrieving, and deleting student records.
-   **Course and Enrollment Scenarios**: Testing the creation of courses, enrollment of students, course prerequisites, and capacity limits.
-   **Sorting and Filtering Scenarios**: Ensuring that sorting and filtering of data (e.g., students by grade or courses by name) is functioning as expected.

## **3. Advanced Testing Requirements**

### **3.1 Mock Data**

Comprehensive mock data is used throughout the tests to simulate real-world scenarios. This mock data ensures the API is tested without affecting production data. Example scenarios include:

-   Creating mock students, courses, and enrollment records.
-   Simulating different user roles (e.g., Admin, Instructor, Student).

### **3.2 Error and Exception Handling**

Tests include scenarios where errors are expected, such as invalid inputs, network failures, or invalid course enrollment attempts. The system's ability to handle and respond to these exceptions is critical for ensuring robust behavior.

### **3.3 Contract Testing for API Endpoints**

Contract testing ensures that the API endpoints adhere to expected input and output formats. This is crucial to ensure that the backend API meets the needs of the frontend and other consumers. Tests include verifying endpoint responses and ensuring that the expected schema is followed.

---

## **4. Test File/Directory Structure**

The test suite is organized into different directories based on functionality:

```
╰─[:)] % tree .
.
├── _controllers
│   ├── auth.test.ts           # Authentication logic tests
│   ├── course.test.ts         # Course management tests
│   ├── enrollment.test.ts     # Enrollment functionality tests
│   ├── instructor.test.ts     # Instructor-related tests
│   ├── sort.test.ts           # Sorting and filtering tests
│   └── student.test.ts        # Student management tests
├── _endToEnd
│   └── index.test.ts          # End-to-end test scenario for the entire system
├── _routes
│   ├── 404.test.ts            # Route not found error handling
│   ├── auth.test.ts           # Authentication routes testing
│   ├── course.test.ts         # Course-related API routes
│   ├── enrollment.test.ts     # Enrollment route testing
│   ├── instructor.test.ts     # Instructor routes
│   ├── sort.test.ts           # Sorting route validation
│   └── student.test.ts        # Student API routes
└── _utils
    ├── mailer.test.ts         # Mailer utility testing
    ├── middleware
    │   ├── authenticateUser.test.ts  # Middleware for authentication
    │   ├── isInstructor.test.ts      # Instructor validation middleware
    │   └── rateLimitStudent.test.ts  # Rate-limiting middleware for students
    └── sortingFunctions.test.ts      # Sorting utility functions
```

---

### **Next Steps**

In the next section, you can add the **test results** for each module, providing insights on the outcome of the tests (e.g., passed, failed, time taken for each test), and highlight any issues encountered during testing. This will allow for a complete analysis of the test outcomes.

Here's an overall documentation summary based on the test results and the context provided:

---

### **Project Overview**

This project involves building and testing a full-stack web application for managing courses, enrollments, and users, primarily for instructors and students. The application includes key features for managing user accounts, courses, enrollments, and related activities. The system uses multiple modules, including controllers, models, routes, utilities, and middleware.

---

### **Test Summary**

The project includes both unit tests and end-to-end tests to ensure the application’s functionality and robustness. The unit tests cover various parts of the application, such as controllers, models, routes, and utilities. End-to-end tests validate the overall user workflows, ensuring that actions like creating instructors, enrolling students, and managing courses work as expected.

#### **Test Results Overview**

-   **Unit Tests:**

    -   **Total Tests:** 188 tests
    -   **Passed Tests:** 188 tests
    -   **Test Coverage:**
        -   **Statements:** 85.86%
        -   **Branches:** 53.84%
        -   **Functions:** 91.11%
        -   **Lines:** 85.86%

    Coverage is high across most of the codebase, with most files showing good levels of test coverage. Some files like `auth.ts`, `courses.ts`, and `students.ts` have lower statement coverage, especially in specific lines of code.

-   **End-to-End Tests:**

    -   **Test Results:** 100% of end-to-end tests passed.
    -   These tests simulate real-world user actions such as creating users, logging in, enrolling students in courses, and checking course and enrollment details.

    **Sample End-to-End Tests:**

    -   Creating and verifying the existence of instructors and students.
    -   Enrolling students in courses.
    -   Validating the ability to add, fetch, and delete courses and enrollments.
    -   Simulating the login and session management flow for both instructors and students.

#### **File Coverage Breakdown:**

1. **Controllers:**
   Some files have lower coverage, with the `auth.ts` and `courses.ts` files showing low branch and statement coverage, suggesting that certain logic or conditions are not fully tested.

2. **Models:**
   The models have 100% test coverage, indicating that all core model structures and their functionality have been tested thoroughly.

3. **Routes:**
   All routes are fully covered with tests, ensuring that endpoints like user authentication, course creation, and student enrollment are functioning as expected.

4. **Utils:**
   The `cache.ts`, `logger.ts`, and `mailer.ts` files have lower coverage, particularly in specific branches and functions. Additional testing might be needed in areas such as mailer functionality.

5. **Middleware and Validators:**
   These modules have decent coverage, but areas like `authenticateUser.ts` could benefit from more extensive testing in terms of different authentication scenarios.

---

### **Test Summary & Findings**

While the test results showed overall good functionality, there were a few minor bugs and redundancies that the tests helped uncover. These issues can be addressed to improve the overall code quality and performance.

#### **High Test Coverage**

The project maintains a high overall test coverage, particularly in the core models and routes, ensuring the main functionalities are operating as expected. However, the test suite also highlighted some minor bugs and redundancies in the codebase that were previously overlooked.

#### **Minor Bugs and Redundancies Identified**

1. **Controller Redundancy:**

    - In files like `auth.ts` and `courses.ts`, redundant logic was discovered in certain methods. For example, in the `auth.ts` controller, there was repeated validation of credentials across different methods, which can be abstracted into a single helper function. This redundancy was flagged by the tests, as it caused some duplication of logic.
    - **Suggested Improvement:** Consolidating duplicate logic enhanced maintainability and reduce potential errors from inconsistent checks.

2. **Missing Edge Case Handling in Utils:**

    - In the `mailer.ts` utility, the tests showed that certain edge cases, such as failed email delivery or incorrect email format, were not adequately handled. This could lead to potential issues in production when certain conditions are met but not explicitly tested for.
    - **Suggested Improvement:** Expand the test cases to handle scenarios like connection timeouts, and failed email transmissions to ensure all possible outcomes are accounted for.

3. **Controller Test Coverage Gaps:**
    - Some controllers, such as `enrollment.ts`, exhibited gaps in test coverage. Specifically, the logic for updating enrolling a was not fully covered by the tests, leading to untested branches in the code. This could be problematic if new features or changes are introduced to the student management system.
    - **Suggested Improvement:** Adding tests for edge cases such as invalid student IDs or missing data fields would ensure better coverage and stability.

#### **End-to-End Testing Insights**

While the end-to-end tests confirmed that workflows like creating instructors, enrolling students, and managing courses are functioning as expected, a few minor issues were identified:

-   **Course Enrollment Redundancy:**
    Some parts of the end-to-end workflow, such as enrolling students into courses, were tested multiple times in different scenarios without adding much new value. This redundancy could slow down the testing process and unnecessarily complicate the test suite.
    -   **Suggested Improvement:** Streamline the test cases to avoid redundant steps, ensuring that the most relevant scenarios are covered without repeating the same tests.

---

## Images of the Test Results

### 1. Over all Tests Result

---

![Swagger API Documentation](./public/Screenshot%202025-01-06%20at%2009.39.14.png)

### 2. End to End Test results

---

![Swagger API Documentation](./public/Screenshot%202025-01-06%20at%2009.38.47.png)

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

5.  Run all test using the command below:

    ```bash
    npm run test
    ```

6.  Run end to end test using the command
7.  ```bash
    npm run test:e2e
    ```

---

## Technologies Used

-   **Node.js**: JavaScript runtime for building scalable applications.
-   **Express.js**: Web framework for building APIs.
-   **MongoDB-Memory-Database**: An in memory database for testing purposes and temporary data storage.
-   **TypeScript**: Typed superset of JavaScript for improved development experience.
-   **Jest**: JavaScript testing library for testing APIS and web applications

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
