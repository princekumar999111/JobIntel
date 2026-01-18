"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
const playwrightScraper_1 = require("../services/playwrightScraper");
const Source_1 = require("../models/Source");
const Snapshot_1 = require("../models/Snapshot");
const deltaDetector_1 = require("../services/deltaDetector");
const db_1 = require("../config/db");
dotenv_1.default.config();
async function runAll() {
    const sources = await Source_1.Source.find({ enabled: true }).lean();
    for (const s of sources) {
        try {
            // eslint-disable-next-line no-console
            console.log('Scraping', s.url);
            const r = await (0, playwrightScraper_1.scrapeOnce)({ id: s._id?.toString(), url: s.url, selector: s.selector });
            // r may include feed items if scraper fetched links
            // For each fed item, check snapshot hash and only ingest if changed
            if (r && Array.isArray(r.items)) {
                for (const item of r.items) {
                    const html = item.rawHtml || '';
                    const url = item.url || item.link || '';
                    const h = (0, deltaDetector_1.hashContent)(html);
                    const existing = await Snapshot_1.Snapshot.findOne({ url }).lean();
                    if (existing && existing.hash === h) {
                        // unchanged
                        // eslint-disable-next-line no-console
                        console.log('Unchanged, skipping', url);
                        await Snapshot_1.Snapshot.findOneAndUpdate({ url }, { lastSeen: new Date() });
                        continue;
                    }
                    // post ingestion to backend ingest endpoint
                    try {
                        await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/jobs/ingest`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url, rawHtml: html, sourceId: s._id }),
                        });
                        await Snapshot_1.Snapshot.findOneAndUpdate({ url }, { hash: h, lastSeen: new Date(), sourceId: s._id }, { upsert: true });
                    }
                    catch (e) {
                        // eslint-disable-next-line no-console
                        console.error('Ingest post failed for', url, e?.message || e);
                    }
                }
            }
            else {
                // fallback: update source lastRun/result
                await Source_1.Source.findByIdAndUpdate(s._id, { lastRun: new Date(), lastResult: JSON.stringify(r).slice(0, 200) });
            }
            // eslint-disable-next-line no-console
            console.log('Scrape result', r);
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.error('Scrape failed for', s.url, e?.message || e);
            await Source_1.Source.findByIdAndUpdate(s._id, { lastRun: new Date(), lastResult: String(e?.message || e) });
        }
    }
}
if (require.main === module) {
    (async () => {
        const MONGODB_URI = process.env.MONGODB_URI || '';
        try {
            await (0, db_1.connectDB)(MONGODB_URI);
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Scheduler: DB connect failed, continuing (no sources will be found):', err?.message || err);
        }
        // run immediately and schedule (or exit after one run if RUN_ONCE=1)
        await runAll();
        if (process.env.RUN_ONCE === '1') {
            // eslint-disable-next-line no-console
            console.log('RUN_ONCE=1, exiting after single run');
            process.exit(0);
        }
        const schedule = process.env.SCRAPE_CRON || '*/15 * * * *';
        node_cron_1.default.schedule(schedule, () => {
            runAll();
        });
    })();
}
