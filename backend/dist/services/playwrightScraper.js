"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeOnce = scrapeOnce;
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config();
// Simple scraper that fetches a page, extracts job links and raw HTML
async function scrapeOnce(source) {
    // If SCRAPER_MODE=http use simple fetch-only scraping (no Playwright)
    const mode = process.env.SCRAPER_MODE || 'playwright';
    const selector = source.selector || 'a';
    // helper to POST ingestion
    const postIngest = async (url, rawHtml) => {
        try {
            await (0, node_fetch_1.default)(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/jobs/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, rawHtml }),
            });
        }
        catch (e) {
            // ignore
        }
    };
    if (mode === 'http') {
        // Fetch page HTML and extract links via regex (best-effort)
        const res = await (0, node_fetch_1.default)(source.url, { timeout: 20000 });
        const html = await res.text();
        const linkMatches = Array.from(html.matchAll(/href=["']?([^"' >]+)/g)).map((m) => m[1]);
        const links = linkMatches.filter(Boolean).slice(0, 20);
        const feed = [];
        for (let i = 0; i < Math.min(5, links.length); i++) {
            const link = links[i];
            try {
                const r = await (0, node_fetch_1.default)(link, { timeout: 10000 });
                const rawHtml = await r.text();
                feed.push({ url: link, rawHtml });
            }
            catch (e) {
                // ignore
            }
        }
        for (const item of feed)
            await postIngest(item.url, item.rawHtml);
        return { linksCount: links.length, fed: feed.length, mode: 'http' };
    }
    // Default: try to load Playwright dynamically (may error if not installed)
    const { chromium } = await Promise.resolve().then(() => __importStar(require('playwright')));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(source.url, { waitUntil: 'load', timeout: 30000 });
        const links = await page.$$eval(selector, (els) => els.map((el) => (el.href ? el.href : null)).filter(Boolean));
        const feed = [];
        for (let i = 0; i < Math.min(5, links.length); i++) {
            const link = links[i];
            try {
                const res = await (0, node_fetch_1.default)(link, { timeout: 10000 });
                const rawHtml = await res.text();
                feed.push({ url: link, rawHtml });
            }
            catch (e) {
                // ignore fetch errors
            }
        }
        for (const item of feed)
            await postIngest(item.url, item.rawHtml);
        return { linksCount: links.length, fed: feed.length, mode: 'playwright' };
    }
    finally {
        await page.close();
        await browser.close();
    }
}
if (require.main === module) {
    // simple CLI runner
    const url = process.argv[2] || process.env.SCRAPE_URL;
    if (!url) {
        console.error('Provide URL as arg or SCRAPE_URL env');
        process.exit(1);
    }
    scrapeOnce({ url }).then((r) => {
        console.log('scrape result', r);
        process.exit(0);
    }).catch((e) => {
        console.error(e);
        process.exit(2);
    });
}
