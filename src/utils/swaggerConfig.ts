import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "School Management System - API Documentation",
            version: "v1.0.0",
            description: `A robust, scalable web application designed to digitize and streamline school administrative processes,
                focusing on comprehensive data management, complex sorting mechanisms, and efficient API design.`,
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"],
};
export const swaggerDocs = swaggerJsdoc(swaggerOptions);
