"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure env is loaded
if (!process.env.JWT_SECRET) {
    dotenv_1.default.config();
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_9f3a2b4c";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
async function register(req, res) {
    const { email, password, name } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: "email and password required" });
    const existing = await User_1.User.findOne({ email });
    if (existing)
        return res.status(400).json({ message: "User already exists" });
    const hash = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.User.create({ email, passwordHash: hash, name });
    return res.status(201).json({ id: user._id, email: user.email });
}
function signAccessToken(user) {
    return jsonwebtoken_1.default.sign({ sub: user._id, roles: user.roles }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function signRefreshToken(user) {
    return jsonwebtoken_1.default.sign({ sub: user._id }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: "email and password required" });
    const user = await User_1.User.findOne({ email });
    if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: "Invalid credentials" });
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return res.json({ accessToken, refreshToken });
}
async function refreshToken(req, res) {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ message: "Missing token" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.User.findById(payload.sub);
        if (!user)
            return res.status(401).json({ message: "User not found" });
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        return res.json({ accessToken, refreshToken });
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
