"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkills = void 0;
const Job_1 = require("../models/Job");
const Skill_1 = require("../models/Skill");
const getSkills = async (_req, res) => {
    try {
        // try to collect distinct tech stack entries from jobs
        const jobSkills = await Job_1.Job.distinct('meta.techStack');
        const adminSkillsDocs = await Skill_1.Skill.find().lean();
        const adminSkills = (adminSkillsDocs || []).map((s) => String(s.name));
        // distinct may return nested arrays; normalize
        const flat = [];
        (jobSkills || []).forEach((s) => {
            if (!s)
                return;
            if (Array.isArray(s))
                s.forEach((x) => x && flat.push(String(x)));
            else
                flat.push(String(s));
        });
        // merge admin skills and job-derived skills
        const merged = Array.from(new Set([...flat.map((s) => s.trim()), ...adminSkills])).filter(Boolean);
        const uniq = merged.sort((a, b) => a.localeCompare(b));
        return res.json(uniq);
    }
    catch (err) {
        console.error('getSkills error', err);
        return res.status(500).json({ error: err?.message || 'server error' });
    }
};
exports.getSkills = getSkills;
