import { createClient, RedisClientType } from "redis";

const client: RedisClientType = createClient();

const DEFAULT_EXPIRATION_TIME = 60;

(async () => {
    try {
        if (!client.isReady) {
            await client.connect();
        }
    } catch (err) {
        console.error("Error connecting to Redis:", err);
    }
})();

export const getOrSetCache = async (
    key: string,
    cb: () => Promise<any>
): Promise<any> => {
    if (!client.isReady) {
        await client.connect();
    }

    const data = await client.get(key);

    if (data != null) {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }

    const result = await cb();
    await client.setEx(key, DEFAULT_EXPIRATION_TIME, JSON.stringify(result));
    return result;
};

// Cleanup Redis client on process exit
process.on("SIGINT", async () => {
    console.log("Closing Redis client...");
    await client.quit();
    process.exit(0);
});
