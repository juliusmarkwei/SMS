import request from "supertest";
import app, { server } from "../../script";
import { client, getOrSetCache } from "../../utils/cache";
import { generateTestToken } from "../../test_data/user.data";
import mongoose from "mongoose";

jest.mock("../../models/Course");
jest.mock("../../models/Student");
jest.mock("../../utils/cache");

const baseUrl = "/api/v1/sort";
let token: string;

describe("Sort Course And Student Routes", () => {
    beforeEach(() => {
                jest.clearAllMocks();
                token = generateTestToken({ role: "instructor" });
            });
            afterEach(() => {
                jest.clearAllMocks();
            });
            afterAll(async () => {
                if (client.isReady) {
                    await client.quit(); // Close the Redis connection
                }
                server.close(); // close server
                await mongoose.connection.close();
            });

    describe("GET /sort/courses", () => {
        it("should return 400 if sortBy parameter is missing", async () => {
            const response = await request(app).get(`${baseUrl}/courses`)
            .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Sort parameter is required.");
            expect(response.body.success).toBe(false);
        });

        it("should return 404 if no courses are found", async () => {
            (getOrSetCache as jest.Mock).mockResolvedValue([]);
            const response = await request(app).get(
                `${baseUrl}/courses?sortBy=name`
            ).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No courses found.");
            expect(response.body.success).toBe(false);
        });

        it("should return sorted courses successfully", async () => {
            const mockCourses = [
                { name: "Math", code: "MTH101", credits: 3, semester: "Fall", department: "Science" },
                { name: "English", code: "ENG102", credits: 2, semester: "Spring", department: "Arts" },
            ];

            (getOrSetCache as jest.Mock).mockResolvedValue(mockCourses);

            const response = await request(app).get(
                `${baseUrl}/courses?sortBy=name&order=asc&page=1&limit=2`
            ).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].name).toBe("English");
            expect(response.body.data[1].name).toBe("Math");
        });

        it("should handle errors gracefully", async () => {
            (getOrSetCache as jest.Mock).mockImplementation(() => {
                throw new Error("Something went wrong");
            });

            const response = await request(app).get(
                `${baseUrl}/courses?sortBy=name`
            ).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Internal server error.");
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /sort/students", () => {
        it("should return 400 if sortBy parameter is missing", async () => {
            const response = await request(app).get(`${baseUrl}/students`).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Sort parameter is required.");
            expect(response.body.success).toBe(false);
        });

        it("should return 404 if no students are found", async () => {
            (getOrSetCache as jest.Mock).mockResolvedValue([]);
            const response = await request(app).get(
                `${baseUrl}/students?sortBy=name`
            ).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No students found.");
            expect(response.body.success).toBe(false);
        });

        it("should return sorted students successfully", async () => {
            const mockStudents = [
                { name: "Alice", level: 200, cgpa: 3.5, gender: "Female", address: "123 Main St" },
                { name: "Bob", level: 100, cgpa: 3.8, gender: "Male", address: "456 Park Ave" },
            ];

            (getOrSetCache as jest.Mock).mockResolvedValue(mockStudents);

            const response = await request(app).get(
                `${baseUrl}/students?sortBy=name&order=asc&page=1&limit=2`
            ).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].name).toBe("Alice");
            expect(response.body.data[1].name).toBe("Bob");
        });

        it("should handle errors gracefully", async () => {
            (getOrSetCache as jest.Mock).mockImplementation(() => {
                throw new Error("Something went wrong");
            });

            const response = await request(app).get(
                `${baseUrl}/students?sortBy=name`
            ).set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Internal server error.");
            expect(response.body.success).toBe(false);
        });
    });
});
