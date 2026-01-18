"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const aiClient_1 = __importDefault(require("../services/aiClient"));
function scoreField(pred, expected, field) {
    const p = (pred[field] || '').toString().toLowerCase();
    const e = (expected[field] || '').toString().toLowerCase();
    if (!e)
        return 0;
    if (!p)
        return 0;
    // partial credit if expected is substring of predicted or vice-versa
    if (p === e)
        return 1;
    if (p.includes(e) || e.includes(p))
        return 0.8;
    return 0;
}
async function run() {
    const file = path_1.default.join(__dirname, '..', '..', 'test-data', 'parseSamples.json');
    const raw = fs_1.default.readFileSync(file, 'utf-8');
    const cases = JSON.parse(raw);
    let total = 0;
    let score = 0;
    const details = [];
    for (const c of cases) {
        total += 3; // title, company, location
        const parsed = await aiClient_1.default.parseJob({ html: c.html }, true);
        const sTitle = scoreField(parsed, c.expected, 'title');
        const sCompany = scoreField(parsed, c.expected, 'company');
        const sLocation = scoreField(parsed, c.expected, 'location');
        score += sTitle + sCompany + sLocation;
        details.push({ id: c.id, expected: c.expected, parsed: parsed, scores: { sTitle, sCompany, sLocation } });
    }
    const accuracy = (score / total) * 100;
    console.log('AI Parse Evaluation');
    console.log('Cases:', cases.length, 'Total points:', total, 'Score:', score.toFixed(2), 'Accuracy:', accuracy.toFixed(1) + '%');
    console.log('Details:');
    console.dir(details, { depth: 2 });
    // exit code non-zero if accuracy below threshold
    const threshold = Number(process.env.AI_EVAL_THRESHOLD || 60);
    if (accuracy < threshold) {
        console.warn(`Accuracy ${accuracy.toFixed(1)}% < threshold ${threshold}%, failing`);
        process.exit(2);
    }
    process.exit(0);
}
if (require.main === module)
    run();
