import request from "supertest";
import app, { server } from "../../script";
import User from "../../models/User";
import Student from "../../models/Student";
import { Role } from "../../utils/enums";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcrypt";
import {generateTestToken} from "../../test_data/user.data"
import { client, getOrSetCache } from "../../utils/cache";

jest.mock("../../models/User");
jest.mock("../../models/Student");
jest.mock("../../utils/mailer");
jest.mock("../../utils/cache");
jest.mock("../../utils/logger");

const baseUrl = "/api/v1/students";
let token: string;

describe("Student Routes", () => {
    const mockStudentId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();
    const mockPassword = "password123";
    const hashedPassword = bcrypt.hashSync(mockPassword, 10);

    const mockStudent = {
        _id: mockStudentId,
        user: mockUserId,
        level: 3,
        cgpa: 3.8,
    };

    const mockUser = {
        _id: mockUserId,
        name: "John Doe",
        email: "john.doe@example.com",
        password: hashedPassword,
        role: Role.STUDENT,
        phone: "1234567890",
        gender: "male",
        dateOfBirth: "1990-01-01",
        address: "123 Main Street",
    };

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

    describe("POST /students", () => {
        it("should create a new student successfully", async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (User.prototype.save as jest.Mock).mockResolvedValue(mockUser);
            (Student.prototype.save as jest.Mock).mockResolvedValue(mockStudent);

            const response = await request(app).post(`${baseUrl}`)
            .set("Authorization", `Bearer ${token}`).send({
                name: "John Doe",
                email: "john.doe@example.com",
                password: "password123",
                phone: "1234567890",
                gender: "male",
                dateOfBirth: "1990-01-01",
                address: "123 Main Street",
                level: 100,
                cgpa: 3.8,
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("student created successfully!");
        });

        it("should return 400 if the student already exists", async () => {
            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app).post(`${baseUrl}`)
            .set("Authorization", `Bearer ${token}`).send({
                name: "John Doe",
                email: "john.doe@example.com",
                password: "password123",
                phone: "1234567890",
                gender: "male",
                dateOfBirth: "1990-01-01",
                address: "123 Main Street",
                level: 100,
                cgpa: 3.8,
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Student already exists!");
        });

        it("should return 500 if an internal server error occurs", async () => {
            (User.findOne as jest.Mock).mockImplementation(() => {
                throw new Error("Database error");
            });

            const response = await request(app).post(`${baseUrl}`)
            .set("Authorization", `Bearer ${token}`).send({
                name: "Jeremiah Alvarado",
                email: "jeremiah.alvarado@example.com",
                password: "password123",
                phone: "1234567890",
                gender: "male",
                dateOfBirth: "1990-01-01",
                address: "123 Main Street",
                level: 200,
                cgpa: 3.3,
            });

            expect(response.body.error).toBe("Internal server error.");
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /students/:studentId", () => {
        it("should return the student if found", async () => {
            (getOrSetCache as jest.Mock).mockResolvedValue(mockStudent);

            const response = await request(app)
                .get(`${baseUrl}/${mockStudentId}`)
                .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.student).toBeDefined();
        });

        it("should return 404 if the student is not found", async () => {
            ((Student.findOne as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue(null),
            }) as jest.Mock);

            (getOrSetCache as jest.Mock).mockImplementation(async (key, callback) => {
                return await callback();
            });
            const response = await request(app)
                .get(`${baseUrl}/${mockStudentId}`)
                .set("Authorization", `Bearer ${token}`)

            expect(response.body.error).toBe("Student not found");
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 if studentId is invalid", async () => {
            const response = await request(app)
                .get(`${baseUrl}/invalidId`)
                .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("studentId not provided or is invalid");
        });
    });

    describe("PUT /students/:studentId", () => {
        it("should update the student successfully", async () => {
            (Student.findById as jest.Mock).mockResolvedValue(mockStudent);
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
            (Student.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockStudent);

            const response = await request(app)
                .put(`${baseUrl}/${mockStudentId}`)
                .send({
                    name: "Jane Doe",
                    phone: "0987654321",
                    address: "456 Another Street",
                })
                .set("Authorization", `Bearer ${token}`)

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Student updated successfully");
        });

        it("should return 404 if the student is not found", async () => {
            (Student.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put(`${baseUrl}/${mockStudentId}`)
                .send({
                    name: "Jane Doe",
                    phone: "0987654321",
                    address: "456 Another Street",
                })
                .set("Authorization", `Bearer ${token}`)

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe("Student not found");
        });
    });

    describe("DELETE /students/:studentId", () => {
        it("should delete the student successfully", async () => {
            (Student.findByIdAndDelete as jest.Mock).mockResolvedValue(mockStudent);
            (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete(`${baseUrl}/${mockStudentId}`)
                .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Student deleted successfully");
        });

        it("should return 404 if the student is not found", async () => {
            (Student.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete(`${baseUrl}/${mockStudentId}`)
                .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Student not found");
        });
    });
});
