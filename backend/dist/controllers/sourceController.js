"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSources = listSources;
exports.getSource = getSource;
exports.createSource = createSource;
exports.updateSource = updateSource;
exports.deleteSource = deleteSource;
const Source_1 = require("../models/Source");
async function listSources(_req, res) {
    const sources = await Source_1.Source.find().lean();
    res.json(sources);
}
async function getSource(req, res) {
    const { id } = req.params;
    const s = await Source_1.Source.findById(id).lean();
    if (!s)
        return res.status(404).json({ message: 'Not found' });
    res.json(s);
}
async function createSource(req, res) {
    const payload = req.body;
    try {
        const s = await Source_1.Source.create(payload);
        res.status(201).json(s);
    }
    catch (err) {
        res.status(400).json({ message: err?.message || 'Invalid' });
    }
}
async function updateSource(req, res) {
    const { id } = req.params;
    try {
        const s = await Source_1.Source.findByIdAndUpdate(id, req.body, { new: true }).lean();
        if (!s)
            return res.status(404).json({ message: 'Not found' });
        res.json(s);
    }
    catch (err) {
        res.status(400).json({ message: err?.message || 'Invalid' });
    }
}
async function deleteSource(req, res) {
    const { id } = req.params;
    await Source_1.Source.findByIdAndDelete(id);
    res.json({ ok: true });
}
