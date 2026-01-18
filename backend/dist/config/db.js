"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.stopInMemory = stopInMemory;
const mongoose_1 = __importDefault(require("mongoose"));
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)("jobintel:db");
let inMemoryServer = null;
async function connectDB(mongoUri) {
    // Try provided URI first
    if (mongoUri) {
        try {
            await mongoose_1.default.connect(mongoUri);
            log("Connected to MongoDB URI");
            return;
        }
        catch (err) {
            log("Failed to connect with provided MONGODB_URI:", err?.message || err);
            // In production we should not silently fall back to an in-memory DB
            const allowFallback = process.env.USE_INMEM === "true" && process.env.NODE_ENV !== "production";
            if (!allowFallback)
                throw err;
            log("Falling back to in-memory MongoDB because USE_INMEM=true in a non-production environment.");
        }
    }
    else {
        if (process.env.NODE_ENV === "production") {
            // In production a MONGODB_URI must be provided
            throw new Error("MONGODB_URI is required in production environment");
        }
    }
    // Start in-memory MongoDB for local dev/testing (only if allowed)
    if (process.env.NODE_ENV === "production" && process.env.USE_INMEM !== "true") {
        throw new Error("Refusing to start in-memory MongoDB in production environment");
    }
    try {
        // lazy import so package is optional
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { MongoMemoryServer } = require("mongodb-memory-server");
        inMemoryServer = await MongoMemoryServer.create();
        const uri = inMemoryServer.getUri();
        await mongoose_1.default.connect(uri);
        log("Connected to in-memory MongoDB");
    }
    catch (err) {
        log("Failed to start in-memory MongoDB:", err);
        throw err;
    }
}
async function stopInMemory() {
    if (mongoose_1.default.connection.readyState)
        await mongoose_1.default.disconnect();
    if (inMemoryServer)
        await inMemoryServer.stop();
}
