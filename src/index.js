import dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env",
});

const validateEnv = () => {
    const requiredEnv = [
        "MONGODB_URI",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
    ];

    const missing = requiredEnv.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
        console.warn(`[WARN] Missing environment variables: ${missing.join(", ")}. Ensure .env is configured.`);
    }
};

validateEnv();

let server;

connectDB()
    .then(() => {
        if (!process.env.VERCEL) {
            const port = process.env.PORT || 8000;
            server = app.listen(port, () => {
                console.log(`Server is running on port : ${port}`);
            });

            const gracefulShutdown = (signal) => {
                console.log(`\nReceived ${signal}. Shutting down gracefully...`);
                if (server) {
                    server.close(async () => {
                        console.log("HTTP server closed.");
                        try {
                            await mongoose.connection.close();
                            console.log("Database connection closed.");
                            process.exit(0);
                        } catch (err) {
                            console.error("Error during database shutdown:", err);
                            process.exit(1);
                        }
                    });
                } else {
                    process.exit(0);
                }
            };

            process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
            process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        }
    })
    .catch((error) => {
        console.error("MongoDB connect failed : ", error);
    });

export default app;
