"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProfileFields = void 0;
const ProfileField_1 = require("../models/ProfileField");
const getPublicProfileFields = async (_req, res) => {
    try {
        const items = await ProfileField_1.ProfileField.find().sort({ createdAt: 1 }).lean();
        return res.json(items);
    }
    catch (err) {
        console.error('getPublicProfileFields', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.getPublicProfileFields = getPublicProfileFields;
