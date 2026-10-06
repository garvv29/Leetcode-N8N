import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env");
}

export async function connectDatabase(): Promise<void> {
    await mongoose.connect(MONGODB_URI!);

    console.log("MongoDB connected");
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();

    console.log("MongoDB disconnected");
}