"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure env is loaded
if (!process.env.JWT_SECRET) {
    dotenv_1.default.config();
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_9f3a2b4c";
async function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Missing token" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.User.findById(payload.sub).select("email roles tier");
        if (!user)
            return res.status(401).json({ message: "User not found" });
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        if (!req.user.roles || !req.user.roles.includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
}
