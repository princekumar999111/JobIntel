"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSessionId = getOrCreateSessionId;
exports.trackPageView = trackPageView;
exports.trackClick = trackClick;
const PageView_1 = require("../models/PageView");
const Visitor_1 = require("../models/Visitor");
const crypto_1 = __importDefault(require("crypto"));
// Generate or retrieve session ID from cookies
function getOrCreateSessionId(req, res) {
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
        sessionId = crypto_1.default.randomBytes(16).toString("hex");
        res.cookie("sessionId", sessionId, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
    }
    return sessionId;
}
// Middleware to track page views
async function trackPageView(req, res, next) {
    try {
        const sessionId = getOrCreateSessionId(req, res);
        const page = req.path;
        const userAgent = req.headers["user-agent"] || "";
        const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown");
        const userId = req.user?.id;
        const referrer = req.headers.referer || undefined;
        // Record page view
        await PageView_1.PageView.create({
            userId,
            page,
            referrer,
            userAgent,
            ipAddress,
            sessionId,
            timestamp: new Date(),
        });
        // Update or create visitor record
        const visitor = await Visitor_1.Visitor.findOneAndUpdate({ sessionId }, {
            $set: {
                lastVisit: new Date(),
                userId,
                userAgent,
                ipAddress,
            },
            $inc: { pageCount: 1 },
            $addToSet: { pages: page },
        }, { upsert: true, new: true });
        // Attach visitor info to request for use in other middleware
        req.visitorId = visitor._id;
        req.sessionId = sessionId;
        res.on("finish", () => {
            // Track on response finish to capture status codes etc
            console.debug(`[Analytics] ${req.method} ${page} - Visitor: ${sessionId.slice(0, 8)}`);
        });
    }
    catch (error) {
        console.warn("Failed to track page view:", error);
    }
    next();
}
// Track user clicks
async function trackClick(req, res, next) {
    try {
        const sessionId = req.sessionId;
        const clickData = req.body;
        if (sessionId) {
            // Update visitor click count
            await Visitor_1.Visitor.findOneAndUpdate({ sessionId }, { $inc: { clickCount: 1 } }, { upsert: true });
            console.debug(`[Analytics] Click tracked for session: ${sessionId.slice(0, 8)}`);
        }
    }
    catch (error) {
        console.warn("Failed to track click:", error);
    }
    next();
}
