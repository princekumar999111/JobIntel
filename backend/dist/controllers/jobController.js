"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJobText = parseJobText;
exports.createJob = createJob;
exports.getJob = getJob;
exports.updateJob = updateJob;
exports.deleteJob = deleteJob;
exports.listJobs = listJobs;
exports.ingestJob = ingestJob;
const Job_1 = require("../models/Job");
const Company_1 = require("../models/Company");
const Revenue_1 = require("../models/Revenue");
const notificationQueue_1 = require("../queues/notificationQueue");
const realtime_1 = require("../utils/realtime");
const jobEmbeddingService_1 = require("../services/jobEmbeddingService");
// AI Job Parser - Parse raw job text and extract structured data
async function parseJobText(req, res) {
    try {
        console.log("parseJobText endpoint called");
        const { rawText } = req.body;
        if (!rawText || rawText.trim().length === 0) {
            return res.status(400).json({ error: "Please provide job text to parse" });
        }
        const lines = rawText.split("\n").map(line => line.trim());
        const fullText = rawText.toLowerCase();
        // Extract Company
        const companyMatch = rawText.match(/(?:Company|🏢)\s*[:\-]?\s*([^\n]+)/i);
        let company = companyMatch ? companyMatch[1].trim() : '';
        // Fallback: sometimes the first line is "Company – Role" or "Company - Role"
        if (!company) {
            const firstLine = lines[0] || '';
            const dashMatch = firstLine.match(/^([A-Z][A-Za-z0-9&\-.\s]{2,80})\s*[-–—:\|]/);
            if (dashMatch)
                company = dashMatch[1].trim();
        }
        if (!company)
            company = 'Company Name';
        // Extract Job Title
        const titleMatch = rawText.match(/(?:Role|Position|Job Title|👨‍💻)\s*[:\-]?\s*([^\n]+)/i);
        let title = titleMatch ? titleMatch[1].trim() : "Job Title";
        title = title.replace(/[🚀📍💰🎓🛠️👨‍💻🏢]/g, "").trim();
        // Extract Location
        const locationMatch = rawText.match(/(?:Location|📍|Based in)\s*[:\-]?\s*([^\n]+)/i);
        let location = locationMatch ? locationMatch[1].trim() : "Bangalore, India";
        location = location.replace(/[📍]/g, "").trim();
        const isRemote = fullText.includes("remote") || fullText.includes("work from home") || fullText.includes("wfh");
        // Extract Salary/Stipend
        const salaryMatch = rawText.match(/(?:Salary|Stipend|CTC|Pay|💰)\s*[:\-]?\s*([^\n]+)/i);
        let salaryText = salaryMatch ? salaryMatch[1].trim().replace(/[💰]/g, "").trim() : "";
        // Trim salaryText if other segments follow on same line (location, link etc.)
        salaryText = salaryText.split(/\b(Location|📍|https?:|🔗)/i)[0].trim();
        let salary = "";
        let stipend = "";
        // Treat explicit 'stipend' or monthly terms as stipend, otherwise treat amounts (₹, LPA, CTC) as salary
        const lowerSalary = salaryText.toLowerCase();
        if (lowerSalary.includes("stipend") || /per\s*(month|mo|pm|monthly)/i.test(salaryText)) {
            stipend = salaryText;
        }
        else if (salaryText) {
            salary = salaryText;
        }
        // Extract Tech Stack
        const TECH_KEYWORDS = [
            "React", "Vue", "Angular", "Node.js", "Python", "Java", "C++", "Go",
            "TypeScript", "JavaScript", "PHP", "Ruby", "Rust", "Kotlin", "Swift",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "MongoDB", "PostgreSQL",
            "MySQL", "Redis", "Elasticsearch", "GraphQL", "REST", "Django", "Flask",
            "Spring", "Express", "Next.js", "Gatsby", "WebSocket", "MQTT", "gRPC"
        ];
        const techStack = [];
        TECH_KEYWORDS.forEach(tech => {
            if (fullText.includes(tech.toLowerCase())) {
                techStack.push(tech);
            }
        });
        // Extract Experience
        const expMatch = rawText.match(/(?:Experience|🎖️|Experience Level)\s*[:\-]?\s*([^\n]+)/i);
        const experience = expMatch ? expMatch[1].trim().replace(/[🎖️]/g, "").trim() : "Not specified";
        // Extract Eligibility
        const eligMatch = rawText.match(/(?:Eligibility|Qualifications|Requirements|🎓)\s*[:\-]?\s*([^\n]+)/i);
        const eligibility = eligMatch ? eligMatch[1].trim().replace(/[🎓]/g, "").trim() : "Graduates";
        // Extract Batch info
        // Extract Batch info: try explicit phrases then fallback to any 4-digit year matches
        const batch = [];
        const batchMatch = rawText.match(/(?:Eligible Batch|BATCH|Batch|Year)\s*[:\-]?\s*(\d{4})(?:\s*[&,\-]\s*(\d{4}))?/i);
        if (batchMatch) {
            batch.push(batchMatch[1]);
            if (batchMatch[2])
                batch.push(batchMatch[2]);
        }
        else {
            const years = Array.from(rawText.matchAll(/\b(20\d{2})\b/g)).map(m => m[1]);
            years.forEach(y => { if (!batch.includes(y))
                batch.push(y); });
        }
        // Generate tags
        const tags = [];
        if (experience.toLowerCase().includes("fresher") || experience.toLowerCase().includes("0-1")) {
            tags.push("Fresher");
        }
        if (experience.toLowerCase().includes("junior") || experience.toLowerCase().includes("1-3")) {
            tags.push("Entry-level");
        }
        if (experience.toLowerCase().includes("senior")) {
            tags.push("Senior");
        }
        tags.push("Internship");
        if (isRemote) {
            tags.push("Remote");
        }
        else {
            tags.push("On-site");
        }
        // Auto-tag company name (useful for filtering/search)
        if (company && company !== 'Company Name')
            tags.push(company);
        // Add batch years as tags
        if (batch && batch.length > 0) {
            batch.forEach((b) => { if (b && !tags.includes(b))
                tags.push(b); });
        }
        // Generate description from raw text
        const description = rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "");
        // extract possible application link(s)
        const urlRegex = /(https?:\/\/[^\s)]+)/gi;
        const urls = Array.from(rawText.matchAll(urlRegex)).map((m) => m[1]);
        const applyLink = urls.length > 0 ? (urls.find(u => /apply|jobs|ats|careers|applynow/i.test(u)) || urls[0]) : undefined;
        return res.json({
            title,
            company,
            description,
            location,
            isRemote,
            salary: salary || undefined,
            stipend: stipend || undefined,
            techStack: [...new Set(techStack)],
            tags: [...new Set(tags)],
            eligibility: eligibility || undefined,
            experience: experience || undefined,
            batch: batch.length > 0 ? batch : undefined,
            applyLink: applyLink || undefined,
        });
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to parse job text", details: err });
    }
}
async function createJob(req, res) {
    try {
        const { title, companyId, rawHtml, status, meta, description, location, isRemote, techStack, tags, eligibility, experience, batch, company, salary, stipend, rawText, applyLink } = req.body;
        // If company name is provided, create/get company
        let companyDocId = companyId;
        let companyName = undefined;
        if (company && !companyId) {
            const companyDoc = await Company_1.Company.findOneAndUpdate({ name: company }, { $set: { name: company } }, { upsert: true, new: true });
            companyDocId = companyDoc._id;
            companyName = companyDoc.name;
        }
        else if (company) {
            companyName = company;
        }
        // Parse batch years to numbers
        const eligibleBatches = batch ? batch.map((b) => parseInt(b)).filter((n) => !isNaN(n)) : [];
        const job = await Job_1.Job.create({
            title,
            companyId: companyDocId,
            rawHtml: rawText || rawHtml,
            description,
            location,
            status: status || "draft",
            batch,
            eligibleBatches,
            meta: {
                ...meta,
                isRemote,
                techStack,
                tags,
                eligibility,
                experience,
                batch,
                salary,
                stipend,
                applyLink: applyLink || (meta && meta.applyLink) || undefined,
                company: companyName || (meta && meta.company) || undefined,
            },
        });
        // Create revenue record for job posting
        try {
            await Revenue_1.Revenue.create({
                jobId: job._id,
                companyId: companyDocId,
                amount: 500, // Default ₹500 per job posting
                currency: 'INR',
                type: 'job_posting',
                status: 'completed',
                description: `Job posting: ${title}`,
                metadata: { jobTitle: title, postedDate: new Date() }
            });
        }
        catch (revenueErr) {
            console.error('Failed to create revenue record:', revenueErr);
        }
        // enqueue/send notification and publish realtime event for clients
        try {
            const payload = {
                type: 'job_published',
                jobId: job._id,
                title: job.title,
                company: job.meta?.company || company || '',
                postedAt: job.createdAt || new Date(),
                body: `New job posted: ${job.title} at ${job.meta?.company || company || ''}`,
            };
            // enqueue email/whatsapp/telegram etc
            await (0, notificationQueue_1.enqueueNotification)(payload);
            // publish to realtime channel for SSE/clients
            (0, realtime_1.publishRealtime)('realtime:notifications', payload);
        }
        catch (notifErr) {
            console.warn('failed to publish job notification', notifErr?.message || notifErr);
        }
        // Generate embedding and match against resumes if job is published
        if (job.status === 'published') {
            try {
                console.log(`Generating embedding for published job ${job._id}...`);
                const { embedding, matches } = await (0, jobEmbeddingService_1.generateJobEmbedding)(job._id.toString());
                // Trigger notifications for matching users
                if (matches && matches.length > 0) {
                    try {
                        await (0, jobEmbeddingService_1.triggerJobMatchNotifications)(job._id.toString(), matches);
                    }
                    catch (notifErr) {
                        console.error('Error triggering match notifications:', notifErr);
                    }
                }
                console.log(`Job ${job._id} embedded with ${matches?.length || 0} matches`);
            }
            catch (embedErr) {
                console.error('Error generating job embedding:', embedErr);
                // Don't fail the job creation if embedding fails - it's a non-blocking operation
            }
        }
        return res.status(201).json(job);
    }
    catch (err) {
        return res.status(500).json({ error: "failed to create job", details: err });
    }
}
// Get job by id
async function getJob(req, res) {
    try {
        const job = await Job_1.Job.findById(req.params.id).lean();
        if (!job)
            return res.status(404).json({ error: "not found" });
        return res.json(job);
    }
    catch (err) {
        return res.status(500).json({ error: "failed to get job", details: err });
    }
}
// Update job
async function updateJob(req, res) {
    try {
        const jobId = req.params.id;
        const updates = req.body;
        // Get current job to check status change
        const currentJob = await Job_1.Job.findById(jobId).lean();
        if (!currentJob)
            return res.status(404).json({ error: "not found" });
        // Parse batch years to numbers if batch is provided
        if (updates.batch) {
            updates.eligibleBatches = updates.batch.map((b) => parseInt(b)).filter((n) => !isNaN(n));
        }
        const job = await Job_1.Job.findByIdAndUpdate(jobId, { $set: updates }, { new: true }).lean();
        if (!job)
            return res.status(404).json({ error: "not found" });
        // publish realtime event on significant updates
        try {
            const payload = {
                type: 'job_updated',
                jobId: job._id,
                title: job.title,
                company: job.meta?.company || '',
                status: job.status,
                postedAt: job.postedAt || job.createdAt,
            };
            await (0, notificationQueue_1.enqueueNotification)(payload);
            (0, realtime_1.publishRealtime)('realtime:notifications', payload);
        }
        catch (err) {
            console.warn('failed to publish job update notification', err?.message || err);
        }
        // Generate embedding if job transitioned to "published" status
        if (currentJob.status !== 'published' && job.status === 'published') {
            try {
                console.log(`Job ${jobId} changed to published. Generating embedding...`);
                const { embedding, matches } = await (0, jobEmbeddingService_1.generateJobEmbedding)(jobId);
                // Trigger notifications for matching users
                if (matches && matches.length > 0) {
                    try {
                        await (0, jobEmbeddingService_1.triggerJobMatchNotifications)(jobId, matches);
                    }
                    catch (notifErr) {
                        console.error('Error triggering match notifications:', notifErr);
                    }
                }
                console.log(`Job ${jobId} embedded with ${matches?.length || 0} matches`);
            }
            catch (embedErr) {
                console.error('Error generating job embedding on status change:', embedErr);
            }
        }
        return res.json(job);
    }
    catch (err) {
        return res.status(500).json({ error: "failed to update job", details: err });
    }
}
// Delete job
async function deleteJob(req, res) {
    try {
        const job = await Job_1.Job.findByIdAndDelete(req.params.id).lean();
        if (!job)
            return res.status(404).json({ error: "not found" });
        try {
            const payload = { type: 'job_deleted', jobId: job._id, title: job.title };
            await (0, notificationQueue_1.enqueueNotification)(payload);
            (0, realtime_1.publishRealtime)('realtime:notifications', payload);
        }
        catch (err) {
            console.warn('failed to publish job delete notification', err?.message || err);
        }
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: "failed to delete job", details: err });
    }
}
// List jobs (simple)
async function listJobs(req, res) {
    try {
        const q = {};
        if (req.query.status)
            q.status = req.query.status;
        const jobs = await Job_1.Job.find(q).limit(100).lean();
        return res.json(jobs);
    }
    catch (err) {
        return res.status(500).json({ error: "failed to list jobs", details: err });
    }
}
// Simple ingestion endpoint: accept url/rawHtml and create company/job
async function ingestJob(req, res) {
    try {
        const { url, rawHtml, company } = req.body;
        // naive parser stub: extract title from rawHtml <title> or from payload
        let title = req.body.title;
        if (!title && rawHtml) {
            const m = /<title>([^<]+)<\/title>/i.exec(rawHtml);
            if (m)
                title = m[1].trim();
        }
        // upsert company
        let companyDoc = null;
        if (company && company.name) {
            companyDoc = await Company_1.Company.findOneAndUpdate({ name: company.name }, { $set: company }, { upsert: true, new: true });
        }
        const job = await Job_1.Job.create({ title: title || "Untitled Job", companyId: companyDoc?._id, rawHtml: rawHtml || "", meta: { sourceUrl: url } });
        return res.status(201).json(job);
    }
    catch (err) {
        return res.status(500).json({ error: "ingest failed", details: err });
    }
}
