"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.updateUser = void 0;
const User_1 = require("../models/User");
const realtime_1 = require("../utils/realtime");
const ProfileField_1 = require("../models/ProfileField");
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body || {};
        // Build allowed keys from static list + admin-defined profile fields
        const staticAllowed = ['name', 'email', 'phone', 'skills', 'batch', 'notificationPrefs'];
        const profileFieldKeys = (await ProfileField_1.ProfileField.distinct('key')) || [];
        const allowed = Array.from(new Set([...staticAllowed, ...profileFieldKeys]));
        const payload = {};
        for (const key of allowed)
            if (key in updates)
                payload[key] = updates[key];
        const user = await User_1.User.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        try {
            (0, realtime_1.publishRealtime)('realtime:users', { type: 'user_updated', userId: user._id, user });
        }
        catch (e) {
            // ignore
        }
        return res.json(user);
    }
    catch (err) {
        console.error('updateUser error', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.updateUser = updateUser;
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findById(id).lean();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        return res.json(user);
    }
    catch (err) {
        console.error('getUser error', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.getUser = getUser;
