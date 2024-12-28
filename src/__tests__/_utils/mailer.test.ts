import { emailNewUsers } from "../../utils/mailer";
import nodemailer from "nodemailer";
import { IUser } from "@/utils/types/user";
import { user1 } from "../../test_data/user.data";

// Mock nodemailer
jest.mock("nodemailer", () => ({
    createTransport: jest.fn(),
}));

const mockSendMail = jest.fn();
const mockCreateTransport = (nodemailer as any).createTransport;

describe("emailNewUsers", () => {
    beforeEach(() => {
        mockCreateTransport.mockReturnValue({
            sendMail: mockSendMail,
        });
    });

    it("should send an email to a new user", async () => {
        await emailNewUsers(user1 as IUser, user1.password);

        expect(mockCreateTransport).toHaveBeenCalledWith({
            service: "gmail",
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT!),
            secure: process.env.EMAIL_SECURE === "true",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        expect(mockSendMail).toHaveBeenCalledWith({
            from: {
                name: "Saint Hills",
                address: process.env.EMAIL_USER!,
            },
            to: user1.email,
            subject: "Welcome to Saint Hills",
            html: expect.stringContaining(`Dear student - ${user1.name}`),
        });
    });

    it("should throw an error if sending email fails", async () => {
        // Mock `sendMail` to throw an error
        mockSendMail.mockImplementation(() => {
            throw new Error("Email sending failed");
        });

        // Expect the function to throw an error
        await expect(
            emailNewUsers(user1 as IUser, user1.password)
        ).rejects.toThrow("Email sending failed");
    });
});
