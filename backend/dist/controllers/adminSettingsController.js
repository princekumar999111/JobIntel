"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfileField = exports.updateProfileField = exports.createProfileField = exports.listProfileFields = exports.deleteAdminSkill = exports.createAdminSkill = exports.listAdminSkills = void 0;
const Skill_1 = require("../models/Skill");
const ProfileField_1 = require("../models/ProfileField");
const realtime_1 = __importDefault(require("../utils/realtime"));
// Skills CRUD
const listAdminSkills = async (_req, res) => {
    try {
        const items = await Skill_1.Skill.find().sort({ name: 1 }).lean();
        return res.json(items);
    }
    catch (err) {
        console.error('listAdminSkills', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.listAdminSkills = listAdminSkills;
const createAdminSkill = async (req, res) => {
    try {
        const { name, custom = true } = req.body;
        if (!name)
            return res.status(400).json({ error: 'name required' });
        const existing = await Skill_1.Skill.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing)
            return res.status(409).json({ error: 'skill already exists' });
        const skill = await Skill_1.Skill.create({ name: String(name).trim(), custom });
        (0, realtime_1.default)('realtime:skills', { type: 'skills', action: 'create', skill });
        return res.status(201).json(skill);
    }
    catch (err) {
        console.error('createAdminSkill', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.createAdminSkill = createAdminSkill;
const deleteAdminSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Skill_1.Skill.findByIdAndDelete(id);
        if (!doc)
            return res.status(404).json({ error: 'not found' });
        (0, realtime_1.default)('realtime:skills', { type: 'skills', action: 'delete', id });
        return res.json({ success: true });
    }
    catch (err) {
        console.error('deleteAdminSkill', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.deleteAdminSkill = deleteAdminSkill;
// Profile Fields CRUD
const listProfileFields = async (_req, res) => {
    try {
        const items = await ProfileField_1.ProfileField.find().sort({ createdAt: 1 }).lean();
        return res.json(items);
    }
    catch (err) {
        console.error('listProfileFields', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.listProfileFields = listProfileFields;
const createProfileField = async (req, res) => {
    try {
        const { key, label, type = 'text', required = false, options = [] } = req.body;
        if (!key || !label)
            return res.status(400).json({ error: 'key and label required' });
        const existing = await ProfileField_1.ProfileField.findOne({ key });
        if (existing)
            return res.status(409).json({ error: 'field key already exists' });
        const field = await ProfileField_1.ProfileField.create({ key, label, type, required, options });
        (0, realtime_1.default)('realtime:profile_fields', { type: 'profile_fields', action: 'create', field });
        return res.status(201).json(field);
    }
    catch (err) {
        console.error('createProfileField', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.createProfileField = createProfileField;
const updateProfileField = async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;
        const field = await ProfileField_1.ProfileField.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!field)
            return res.status(404).json({ error: 'not found' });
        (0, realtime_1.default)('realtime:profile_fields', { type: 'profile_fields', action: 'update', field });
        return res.json(field);
    }
    catch (err) {
        console.error('updateProfileField', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.updateProfileField = updateProfileField;
const deleteProfileField = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await ProfileField_1.ProfileField.findByIdAndDelete(id);
        if (!doc)
            return res.status(404).json({ error: 'not found' });
        (0, realtime_1.default)('realtime:profile_fields', { type: 'profile_fields', action: 'delete', id });
        return res.json({ success: true });
    }
    catch (err) {
        console.error('deleteProfileField', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.deleteProfileField = deleteProfileField;
