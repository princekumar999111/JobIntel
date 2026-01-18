"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const seedAdminSystem_1 = require("./seedAdminSystem");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function main() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || '';
        console.log('Connecting to MongoDB...');
        await (0, db_1.connectDB)(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        console.log('Starting admin system seeding...');
        await (0, seedAdminSystem_1.seedAdminSystem)();
        console.log('Seeding complete! Exiting...');
        process.exit(0);
    }
    catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}
main();
