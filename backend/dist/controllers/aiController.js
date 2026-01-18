"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJobController = parseJobController;
exports.matchController = matchController;
exports.coverController = coverController;
const aiClient_1 = __importDefault(require("../services/aiClient"));
async function parseJobController(req, res) {
    const payload = req.body;
    if (!payload || (!payload.html && !payload.text))
        return res.status(400).json({ message: 'html or text required' });
    const out = await aiClient_1.default.parseJob({ html: payload.html, text: payload.text });
    res.json(out);
}
async function matchController(req, res) {
    const { job, candidate } = req.body;
    if (!job || !candidate)
        return res.status(400).json({ message: 'job and candidate required' });
    const out = await aiClient_1.default.matchCandidate(job, candidate);
    res.json(out);
}
async function coverController(req, res) {
    const { job, candidate } = req.body;
    if (!job || !candidate)
        return res.status(400).json({ message: 'job and candidate required' });
    const out = await aiClient_1.default.generateCoverLetter(job, candidate);
    res.json(out);
}
