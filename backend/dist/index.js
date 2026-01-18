"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const debug_1 = __importDefault(require("debug"));
const db_1 = require("./config/db");
const auth_1 = __importDefault(require("./routes/auth"));
const job_1 = __importDefault(require("./routes/job"));
const company_1 = __importDefault(require("./routes/company"));
const application_1 = __importDefault(require("./routes/application"));
const seo_1 = __importDefault(require("./routes/seo"));
const openapi_1 = __importDefault(require("./routes/openapi"));
const notification_1 = __importDefault(require("./routes/notification"));
const payments_1 = __importDefault(require("./routes/payments"));
const ai_1 = __importDefault(require("./routes/ai"));
const admin_1 = __importDefault(require("./routes/admin"));
const adminRoles_1 = __importDefault(require("./routes/adminRoles"));
const scraperConfig_1 = __importDefault(require("./routes/scraperConfig"));
const source_1 = __importDefault(require("./routes/source"));
const user_1 = __importDefault(require("./routes/user"));
const skills_1 = __importDefault(require("./routes/skills"));
const profileFields_1 = __importDefault(require("./routes/profileFields"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const resume_1 = __importDefault(require("./routes/resume"));
const activity_1 = __importDefault(require("./routes/activity"));
const scraper_1 = __importDefault(require("./routes/scraper"));
const jobMatching_1 = __importDefault(require("./routes/jobMatching"));
const recommendation_1 = __importDefault(require("./routes/recommendation"));
const analytics_2 = require("./middleware/analytics");
dotenv_1.default.config();
const log = (0, debug_1.default)("jobintel:server");
const app = (0, express_1.default)();
// Configure CORS: set CORS_ORIGIN env (comma-separated) in production for stricter security
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
    // Normalize configured origins: trim whitespace and remove any trailing slashes
    const origins = corsOrigin
        .split(',')
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter(Boolean);
    // Add a lightweight middleware that always sets the CORS headers for allowed origins.
    // This avoids throwing an error during the CORS check which resulted in 500 responses.
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        const originNorm = origin ? origin.replace(/\/$/, '') : undefined;
        if (origin && (origin === '*' || (originNorm && origins.includes(originNorm)))) {
            res.setHeader('Access-Control-Allow-Origin', origin === '*' ? '*' : origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        // Handle preflight early so the browser sees the headers on OPTIONS
        if (req.method === 'OPTIONS')
            return res.sendStatus(204);
        next();
    });
    // Use cors() with a permissive callback (do not throw errors) so requests from disallowed origins fail gracefully without 500
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow non-browser requests with no origin (curl, server-to-server)
            if (!origin)
                return callback(null, true);
            const originNorm = origin.replace(/\/$/, '');
            if (origin === '*' || origins.includes(originNorm))
                return callback(null, true);
            // Deny cross-origin requests silently (no exception)
            return callback(null, false);
        },
        credentials: true,
    }));
}
else {
    // Default to permissive for local dev
    app.use((0, cors_1.default)());
}
// Capture raw body for webhook signature verification
app.use(express_1.default.json({ verify: (req, _res, buf, _encoding) => {
        // store raw body string for use in webhook verification
        req.rawBody = buf && buf.toString();
    } }));
app.get("/api/health", async (_req, res) => {
    // Basic healthy probe
    const ok = { service: "jobscout-backend", status: "ok" };
    // Check MongoDB connection state (0 = disconnected, 1 = connected)
    try {
        // lazy require to avoid unnecessary import order issues
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mongoose = require('mongoose');
        const ready = mongoose.connection && mongoose.connection.readyState === 1;
        ok.mongo = ready ? 'connected' : 'disconnected';
        if (!ready)
            ok.status = 'degraded';
    }
    catch (e) {
        ok.mongo = 'unknown';
        ok.status = 'degraded';
    }
    // Check Redis if configured
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Redis = require('ioredis');
        const client = new Redis(process.env.REDIS_URL || undefined);
        // attempt a ping with timeout
        const ping = await Promise.race([
            client.ping(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000)),
        ]);
        ok.redis = ping === 'PONG' ? 'connected' : 'unknown';
        await client.disconnect();
    }
    catch (e) {
        // If no REDIS_URL set, that's acceptable — mark as optional
        ok.redis = process.env.REDIS_URL ? 'disconnected' : 'not-configured';
        if (ok.redis === 'disconnected')
            ok.status = 'degraded';
    }
    const statusCode = ok.status === 'ok' ? 200 : 503;
    return res.status(statusCode).json(ok);
});
// Add page view tracking middleware
app.use(analytics_2.trackPageView);
app.use("/api/auth", auth_1.default);
app.use("/api/jobs", job_1.default);
app.use("/api/companies", company_1.default);
app.use("/api/applications", application_1.default);
app.use("/api/docs", openapi_1.default);
app.use(seo_1.default);
app.use("/api/notifications", notification_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/admin', source_1.default);
app.use('/api/admin/roles', adminRoles_1.default);
app.use('/api/admin/scraper', scraperConfig_1.default);
app.use('/api/admin/job-matching', jobMatching_1.default);
app.use('/api/users', user_1.default);
app.use('/api/skills', skills_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/profile-fields', profileFields_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/activity', activity_1.default);
app.use('/api/resume', resume_1.default);
app.use('/api/scraper', scraper_1.default);
app.use('/api/recommendations', recommendation_1.default);
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "";
(async () => {
    try {
        await (0, db_1.connectDB)(MONGODB_URI);
        log("DB connected");
    }
    catch (err) {
        console.warn("Failed to connect to DB (continuing in degraded mode):", err?.message || err);
    }
    app.listen(PORT, () => {
        log(`Backend listening on http://localhost:${PORT}`);
        // eslint-disable-next-line no-console
        console.log(`Backend listening on http://localhost:${PORT}`);
        // Log SMTP status (do not print secret)
        const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
        console.log('SMTP configured:', smtpConfigured ? `yes (${process.env.SMTP_USER})` : 'no');
    });
})();
