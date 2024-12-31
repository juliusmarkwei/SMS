import request from "supertest";
import User from "../../models/User";
import Instructor from "../../models/Instructor";
import Course from "../../models/Course";
import app, { server } from "../../script";
import { generateTestToken, instructors } from "../../test_data/user.data";
import { client, getOrSetCache } from "../../utils/cache";
import mongoose from "mongoose";

jest.mock("../../models/User");
jest.mock("../../models/Instructor");
jest.mock("../../models/Course");
jest.mock("../../utils/cache");
jest.mock("../../utils/mailer", () => ({
    emailNewUsers: jest.fn(),
}));

const baseUrl = "/api/v1/instructors";
let token: string;

describe("Instructor Routes", () => {
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

    describe("POST /instructors", () => {
        it("should create a new instructor successfully", async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.prototype.save as jest.Mock).mockResolvedValue({});

            Instructor.prototype.save = jest.fn().mockResolvedValue({});
            (Course.find as jest.Mock).mockResolvedValue([]);

            const res = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "John Doe",
                    email: "johndoe@example.com",
                    password: "password123",
                    phone: "123456789",
                    gender: "male",
                    dateOfBirth: "2000-01-01",
                    address: "123 Street",
                    department: "Computer Science",
                    salary: 50000,
                    courses: [],
                });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                success: true,
                message: "instructor created successfully!",
            });
            expect(User.prototype.save).toHaveBeenCalledTimes(1);
            expect(Instructor.prototype.save).toHaveBeenCalledTimes(1);
        });

        it("should return an error if the instructor already exists", async () => {
            (User.findOne as jest.Mock).mockResolvedValue({
                email: "johndoe@example.com",
            }); // User exists

            const res = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "John Doe",
                    email: "johndoe@example.com",
                    password: "password123",
                    phone: "123456789",
                    gender: "male",
                    dateOfBirth: "2000-01-01",
                    address: "123 Street",
                    department: "Computer Science",
                    salary: 50000,
                    courses: [],
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                success: false,
                error: "Instructor already exists!",
            });
        });

        it("should handle validation errors properly", async () => {
            const res = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "",
                    email: "invalid-email",
                    password: "123",
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("success", false);
            expect(res.body).toHaveProperty("error");
        });

        it("should handle unexpected errors gracefully", async () => {
            (User.findOne as jest.Mock).mockRejectedValue(
                new Error("Unexpected error")
            );

            const res = await request(app)
                .post(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "John Doe",
                    email: "johndoe@example.com",
                    password: "password123",
                    phone: "123456789",
                    gender: "male",
                    dateOfBirth: "2000-01-01",
                    address: "123 Street",
                    department: "Computer Science",
                    salary: 50000,
                    courses: [],
                });

            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                success: false,
                error: "Internal server error.",
            });
        });
    });

    describe("GET /instructors", () => {
        it("should fetch all instructors successfully", async () => {
            (getOrSetCache as jest.Mock).mockResolvedValue(instructors);

            const res = await request(app)
                .get(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                instructors,
            });
        });

        it("should return an empty list if no instructors exist", async () => {
            (getOrSetCache as jest.Mock).mockResolvedValue([]);

            const res = await request(app)
                .get(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                instructors: [],
            });
        });

        it("should return a 500 error if fetching instructors fails", async () => {
            (getOrSetCache as jest.Mock).mockImplementation(() => {
                throw new Error(
                    "An error occurred while fetching instructors."
                );
            });

            const res = await request(app)
                .get(`${baseUrl}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                success: false,
                error: "An error occurred while fetching instructors.",
            });
        });
    });

    describe("DELETE /instructors", () => {
        it("should delete an instructor successfully", async () => {
            (Instructor.findByIdAndDelete as jest.Mock).mockResolvedValue({
                user: "userId",
            });
            (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});

            const res = await request(app)
                .delete(`${baseUrl}/instructorId`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: "Instructor deleted successfully",
            });
        });

        it("should return a 404 error if instructor is not found", async () => {
            (Instructor.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .delete(`${baseUrl}/instructorId`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({
                success: false,
                error: "Instructor not found",
            });
        });

        it("should handle unexpected errors during deletion", async () => {
            (Instructor.findByIdAndDelete as jest.Mock).mockRejectedValue(
                new Error("Unexpected error")
            );

            const res = await request(app)
                .delete(`${baseUrl}/instructorId`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                success: false,
                error: "Internal server error.",
            });
        });
    });

    describe("PUT /instructors", () => {
        let instructorId: string;
        let validCourseId: string;

        beforeAll(async () => {
            // Create a user
            const user = {
                _id: 1,
                name: "Mario Reynolds",
                password: "p@$$wOrd123",
                email: "marioreynolds05@gmail.com",
                role: "student",
                phone: "0256849272",
                gender: "male",
                address: "Spintex",
                dateOfBirth: new Date(2003 - 12 - 30),
            };


            const instructor: any = {
                _id: 1,
                user: user._id,
                department: "Computer Science",
                coursesTaught: [],
                salary: 50_000.0,
            };


            instructorId = instructor._id;

            // // Create a valid course for future tests
            const validCourse: any = {
                _id: 1,
                name: "Introduction to Programming",
                description: "Learn the basics of programming",
                duration: 40,
            };

            validCourseId = validCourse._id;
        });

        afterAll(async () => {
            // Cleanup database after tests
            await Instructor.deleteMany();
            await User.deleteMany();
            await Course.deleteMany();
        });

        it("should update an instructor with valid data", async () => {
            (Course.find as jest.Mock).mockResolvedValue([
                { _id: validCourseId },
            ]);
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
                _id: "userId",
                name: "Mario Reynolds",
                email: "marioreynolds05@gmail.com"
            });
            (Instructor.findByIdAndUpdate as jest.Mock).mockResolvedValue({
                _id: "instructorId",
                department: "Computer Science",
                salary: 50000,
                coursesTaught: [],
                user: {
                    _id: "userId",
                    name: "Mario Reynolds",
                    email: "marioreynolds05@gmail.com",
                    address: "Spintex",
                }
            });

            const response = await request(app)
                .put(`${baseUrl}/${instructorId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Jane Doe",
                    phone: "0987654321",
                    gender: "female",
                    dateOfBirth: "1992-02-02",
                    address: "456 Main St",
                    department: "Mathematics",
                    salary: 60000,
                    courses: [validCourseId],
                });

                expect(response.body.message).toBe(
                    "Instructor updated successfully"
                );
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should return 404 for a non-existing instructor", async () => {
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
                _id: "userId",
                name: "Instructor Name",
                email: "instructor@gmail.com"
            });
            (Instructor.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
            const response = await request(app)
                .put(`${baseUrl}/nonExistingId`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Mario Reynolds",
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Instructor not found");
        });

        it("should return 400 for invalid course IDs", async () => {
            (Course.find as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put(`${baseUrl}/${instructorId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    courses: ["invalidCourseId"],
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(
                "One or more courses provided are invalid"
            );
        });
    });
});
