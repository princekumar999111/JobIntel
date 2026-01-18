"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const User_1 = require("./models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
async function writeLocalAdmin(email, hash) {
    const outDir = path_1.default.resolve(__dirname, "..", "dev_data");
    try {
        await promises_1.default.mkdir(outDir, { recursive: true });
        const outFile = path_1.default.join(outDir, "admin.json");
        const payload = {
            email,
            passwordHash: hash,
            roles: ["admin"],
            name: "Admin",
            createdAt: new Date().toISOString()
        };
        await promises_1.default.writeFile(outFile, JSON.stringify(payload, null, 2), { encoding: "utf8" });
        console.log(`Wrote local admin to ${outFile}`);
    }
    catch (err) {
        console.error("Failed to write local admin file:", err);
    }
}
async function run() {
    const uri = process.env.MONGODB_URI || "";
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@jobscout.local";
    const adminPass = process.env.SEED_ADMIN_PASS || "password123";
    try {
        await (0, db_1.connectDB)(uri);
        const existing = await User_1.User.findOne({ email: adminEmail });
        if (existing) {
            console.log("Admin already exists in DB");
            process.exit(0);
        }
        const hash = await bcryptjs_1.default.hash(adminPass, 10);
        const admin = await User_1.User.create({ email: adminEmail, passwordHash: hash, roles: ["admin"], name: "Admin" });
        console.log("Created admin in DB:", admin.email);
        process.exit(0);
    }
    catch (err) {
        console.warn("DB seed failed, falling back to local dev file:", err?.message || err);
        const hash = await bcryptjs_1.default.hash(adminPass, 10);
        await writeLocalAdmin(adminEmail, hash);
        process.exit(0);
    }
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
