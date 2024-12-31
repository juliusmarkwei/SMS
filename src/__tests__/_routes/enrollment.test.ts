import request from "supertest";
import app, { server } from "../../script";
import Enrollment from "../../models/Enrollment";
import Student from "../../models/Student";
import Course from "../../models/Course";
import { client, getOrSetCache } from "../../utils/cache";
import { generateTestToken } from "../../test_data/user.data";
import mongoose from "mongoose";

// Mock dependencies
jest.mock("../../models/Enrollment");
jest.mock("../../models/Student");
jest.mock("../../models/Course");
jest.mock("../../utils/cache");

const baseUrl = "/api/v1/enrollments";
let token: string;

describe("Enrollment Routes", () => {
    beforeEach(() => {
        token = generateTestToken({ role: "instructor" });
    });

    afterAll(async () => {
        if (client.isReady) {
            await client.quit(); // Close the Redis connection
        }
        server.close(); // close server
        await mongoose.connection.close();
    });
    afterEach(async () => {
        jest.clearAllMocks();
    });

    describe("POST /enrollments", () => {
        it("should enroll a student in a course successfully", async () => {
            const mockStudent = { _id: "student123", user: "user123" };
            const mockCourse = { _id: "course123", code: "CS101" };
            const mockEnrollment = {
                _id: "enrollment123",
                student: mockStudent._id,
                course: mockCourse._id,
            };

            // Mock the chainable query
            const mockQuery = {
                select: jest.fn().mockResolvedValue(mockCourse),
            };
            (Course.findOne as jest.Mock).mockReturnValue(mockQuery);
            // mock select()
            (mockQuery.select as jest.Mock).mockResolvedValue(mockCourse);

            (Student.findOne as jest.Mock).mockResolvedValue(mockStudent);
            (Enrollment.prototype.save as jest.Mock).mockResolvedValue(
                mockEnrollment
            );
            (Student.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    studentId: mockStudent._id,
                    courseCode: mockCourse.code,
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                success: true,
                message: "Student enrolled successfully!",
            });
            expect(Enrollment.prototype.save).toHaveBeenCalled();
            expect(Student.findByIdAndUpdate).toHaveBeenCalledWith(
                mockStudent._id,
                { $push: { courses: mockCourse._id } }
            );
        });

        it("should return 400 if studentId or courseCode is missing", async () => {
            const response = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ studentId: "student123" });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                success: false,
                message: "studentId and courseCode are required",
            });
        });

        it("should return 404 if the course does not exist", async () => {
            const mockQuery = {
                select: jest.fn().mockResolvedValue(null),
            };
            (Course.findOne as jest.Mock).mockResolvedValue(mockQuery);

            const response = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ studentId: "student123", courseCode: "CS999" });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                success: false,
                message: "Course with code CS999 not found",
            });
        });

        it("should return 401 if a student tries to enroll another student", async () => {
            token = generateTestToken({ role: "student" });
            (Student.findOne as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ studentId: "anotherStudent123", courseCode: "CS101" });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: "You are not authorized to enroll another student",
            });
        });

        it("should return 500 for unexpected errors", async () => {
            // Mock the chainable query
            const mockQuery = {
                select: jest.fn().mockImplementation(() => {
                    throw new Error("Database error");
                }),
            };
            (Course.findOne as jest.Mock).mockReturnValue(mockQuery);
            const response = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ studentId: "student123", courseCode: "CS101" });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                message: "Internal server error",
            });
        });
    });
});

describe("GET /student/:studentId/courses", () => {
    it("should fetch all courses for a student", async () => {
        const mockCourses = [
            { name: "Math", code: "M101" },
            { name: "Science", code: "S101" },
        ];
        (getOrSetCache as jest.Mock).mockResolvedValue(mockCourses);

        const response = await request(app)
            .get(`${baseUrl}/student/student123`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            courses: mockCourses,
        });
    });

    it("should return 404 if no courses are found for the student", async () => {
        (getOrSetCache as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .get(`${baseUrl}/student/student123`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: "No courses found for this student",
        });
    });
});

describe("DELETE /:enrollmentId", () => {
    it("should delete an enrollment successfully", async () => {
        const mockEnrollment = {
            _id: "enrollment123",
            student: "student123",
            course: "course123",
        };
        (Enrollment.findOneAndDelete as jest.Mock).mockResolvedValue(
            mockEnrollment
        );
        (Student.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .delete(`${baseUrl}/enrollment123`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            message: "Enrollment deleted successfully",
        });
    });

    it("should return 404 if the enrollment does not exist", async () => {
        (Enrollment.findOneAndDelete as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .delete(`${baseUrl}/enrollment123`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: "Enrollment not found!",
        });
    });
});
