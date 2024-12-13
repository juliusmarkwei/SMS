import mongoose from "mongoose";
import "dotenv/config";
import { logger } from "./logger";

const connect = async () => {
    const connection = mongoose.connection.readyState;
    if (connection === 1) {
        logger.info("Already connected to database");
        return;
    }
    if (connection === 2) {
        logger.info("Connecting to database");
        return;
    }

    try {
        mongoose.connect(process.env.MONGODB_URI as string, {
            bufferCommands: true,
        });

        mongoose.connection.on("connected", () => {
            logger.info("Connected to database");
        });
    } catch (error: any) {
        logger.error("Error connecting to database: ", error.message);
    }
};

export default connect;
