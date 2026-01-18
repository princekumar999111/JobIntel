"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sitemapXml = sitemapXml;
exports.robotsTxt = robotsTxt;
const Job_1 = require("../models/Job");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function sitemapXml(req, res) {
    try {
        const base = process.env.PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:3000";
        const jobs = await Job_1.Job.find({}, { updatedAt: 1, createdAt: 1 }).sort({ updatedAt: -1 }).lean();
        const urls = jobs.map((j) => {
            const lastmod = (j.updatedAt || j.createdAt) ? new Date(j.updatedAt || j.createdAt).toISOString() : new Date().toISOString();
            const loc = `${base.replace(/\/$/, "")}/jobs/${j._id}`;
            return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
        }).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        res.header("Content-Type", "application/xml");
        return res.send(xml);
    }
    catch (err) {
        res.status(500).send("<error>failed to generate sitemap</error>");
    }
}
async function robotsTxt(_req, res) {
    const host = process.env.PUBLIC_URL || "http://localhost:3000";
    const content = `User-agent: *\nAllow: /\nSitemap: ${host.replace(/\/$/, "")}/sitemap.xml\n`;
    res.header("Content-Type", "text/plain");
    res.send(content);
}
