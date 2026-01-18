"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCompanies = listCompanies;
exports.getCompany = getCompany;
exports.createCompany = createCompany;
exports.updateCompany = updateCompany;
exports.verifyCompany = verifyCompany;
exports.toggleBlacklist = toggleBlacklist;
exports.deleteCompany = deleteCompany;
exports.bulkImportCompanies = bulkImportCompanies;
exports.getCompanyAnalytics = getCompanyAnalytics;
exports.getCompanyStatistics = getCompanyStatistics;
exports.updateScrapingMetrics = updateScrapingMetrics;
const Company_1 = require("../models/Company");
const AdminActivityLog_1 = require("../models/AdminActivityLog");
// Get all companies with pagination, filtering, and search
async function listCompanies(req, res) {
    try {
        const { page = 1, limit = 20, search, status, verified, blacklisted, priority } = req.query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { website: { $regex: search, $options: 'i' } },
                { industry: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        if (status)
            filter.status = status;
        if (verified)
            filter.verificationStatus = verified;
        if (blacklisted === 'true')
            filter.blacklistedFromScraping = true;
        if (priority)
            filter.scraperPriority = priority;
        const total = await Company_1.Company.countDocuments(filter);
        const companies = await Company_1.Company.find(filter)
            .select('-customData')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        res.status(200).json({
            success: true,
            data: companies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Error listing companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies'
        });
    }
}
// Get single company by ID
async function getCompany(req, res) {
    try {
        const { id } = req.params;
        const company = await Company_1.Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        res.status(200).json({
            success: true,
            data: company
        });
    }
    catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company'
        });
    }
}
// Create new company
async function createCompany(req, res) {
    try {
        const { name, website, careerPage, industry, companySize, founded, contactEmail, contactPhone, hrContactEmail, tags } = req.body;
        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Company name is required'
            });
        }
        // Check if company already exists
        const existing = await Company_1.Company.findOne({
            name: { $regex: `^${name}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Company with this name already exists'
            });
        }
        const company = new Company_1.Company({
            name: name.trim(),
            website,
            careerPage,
            industry,
            companySize,
            founded,
            contactEmail,
            contactPhone,
            hrContactEmail,
            tags: tags || [],
            status: 'pending',
            verificationStatus: 'not_verified',
            lastUpdatedBy: req.user?.id
        });
        await company.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'CREATE_COMPANY',
            resource: 'Company',
            resourceId: company._id,
            changes: { after: company.toObject() },
            severity: 'MEDIUM',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(201).json({
            success: true,
            data: company,
            message: 'Company created successfully'
        });
    }
    catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create company'
        });
    }
}
// Update company
async function updateCompany(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Find existing company
        const company = await Company_1.Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        const before = company.toObject();
        // Update allowed fields
        const allowedFields = [
            'website',
            'careerPage',
            'industry',
            'companySize',
            'founded',
            'contactEmail',
            'contactPhone',
            'hrContactEmail',
            'tags',
            'scraperPriority',
            'customData'
        ];
        allowedFields.forEach(field => {
            if (field in updates) {
                company[field] = updates[field];
            }
        });
        company.lastUpdatedBy = req.user?.id;
        await company.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'UPDATE_COMPANY',
            resource: 'Company',
            resourceId: company._id,
            changes: { before, after: company.toObject() },
            severity: 'MEDIUM',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(200).json({
            success: true,
            data: company,
            message: 'Company updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update company'
        });
    }
}
// Verify company
async function verifyCompany(req, res) {
    try {
        const { id } = req.params;
        const { approved, rejectionReason } = req.body;
        const company = await Company_1.Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        const before = company.toObject();
        if (approved) {
            company.status = 'verified';
            company.verificationStatus = 'verified';
            company.verifiedAt = new Date();
            company.verifiedBy = req.user?.id;
            company.rejectionReason = undefined;
        }
        else {
            if (!rejectionReason || rejectionReason.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Rejection reason is required'
                });
            }
            company.status = 'rejected';
            company.verificationStatus = 'rejected';
            company.rejectionReason = rejectionReason;
        }
        company.lastUpdatedBy = req.user?.id;
        await company.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: approved ? 'VERIFY_COMPANY' : 'REJECT_COMPANY',
            resource: 'Company',
            resourceId: company._id,
            changes: { before, after: company.toObject() },
            severity: 'HIGH',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(200).json({
            success: true,
            data: company,
            message: approved ? 'Company verified successfully' : 'Company rejected'
        });
    }
    catch (error) {
        console.error('Error verifying company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify company'
        });
    }
}
// Toggle blacklist status
async function toggleBlacklist(req, res) {
    try {
        const { id } = req.params;
        const { blacklisted } = req.body;
        if (typeof blacklisted !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Blacklist status must be a boolean'
            });
        }
        const company = await Company_1.Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        const before = company.toObject();
        company.blacklistedFromScraping = blacklisted;
        company.lastUpdatedBy = req.user?.id;
        await company.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: blacklisted ? 'BLACKLIST_COMPANY' : 'WHITELIST_COMPANY',
            resource: 'Company',
            resourceId: company._id,
            changes: { before, after: company.toObject() },
            severity: 'MEDIUM',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(200).json({
            success: true,
            data: company,
            message: blacklisted ? 'Company blacklisted' : 'Company whitelisted'
        });
    }
    catch (error) {
        console.error('Error toggling blacklist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update blacklist status'
        });
    }
}
// Delete company
async function deleteCompany(req, res) {
    try {
        const { id } = req.params;
        const company = await Company_1.Company.findByIdAndDelete(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'DELETE_COMPANY',
            resource: 'Company',
            resourceId: company._id,
            changes: { before: company.toObject() },
            severity: 'HIGH',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(200).json({
            success: true,
            message: 'Company deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete company'
        });
    }
}
// Bulk import companies
async function bulkImportCompanies(req, res) {
    try {
        const { companies } = req.body;
        if (!Array.isArray(companies) || companies.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Companies array is required and must not be empty'
            });
        }
        if (companies.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 1000 companies can be imported at once'
            });
        }
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const created = [];
        const errors = [];
        for (let i = 0; i < companies.length; i++) {
            try {
                const companyData = companies[i];
                if (!companyData.name || companyData.name.trim().length === 0) {
                    errors.push({ index: i, error: 'Company name is required' });
                    continue;
                }
                // Check if already exists
                const existing = await Company_1.Company.findOne({
                    name: { $regex: `^${companyData.name}$`, $options: 'i' }
                });
                if (existing) {
                    errors.push({ index: i, error: 'Company already exists' });
                    continue;
                }
                const company = new Company_1.Company({
                    name: companyData.name.trim(),
                    website: companyData.website,
                    careerPage: companyData.careerPage,
                    industry: companyData.industry,
                    companySize: companyData.companySize,
                    founded: companyData.founded,
                    contactEmail: companyData.contactEmail,
                    contactPhone: companyData.contactPhone,
                    hrContactEmail: companyData.hrContactEmail,
                    tags: companyData.tags || [],
                    status: 'pending',
                    verificationStatus: 'not_verified',
                    bulkUploadBatchId: batchId,
                    lastUpdatedBy: req.user?.id
                });
                await company.save();
                created.push(company);
            }
            catch (error) {
                errors.push({ index: i, error: error.message });
            }
        }
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'BULK_IMPORT_COMPANIES',
            resource: 'Company',
            resourceId: batchId,
            changes: {
                after: {
                    batchId,
                    created: created.length,
                    errors: errors.length,
                    total: companies.length
                }
            },
            severity: 'HIGH',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(200).json({
            success: true,
            data: {
                batchId,
                created: created.length,
                failed: errors.length,
                total: companies.length,
                errors: errors.length > 0 ? errors : undefined,
                companies: created
            },
            message: `Imported ${created.length} companies${errors.length > 0 ? `, ${errors.length} failed` : ''}`
        });
    }
    catch (error) {
        console.error('Error bulk importing companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to bulk import companies'
        });
    }
}
// Get company analytics
async function getCompanyAnalytics(req, res) {
    try {
        const { id } = req.params;
        const company = await Company_1.Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        const analytics = {
            companyName: company.name,
            status: company.status,
            verificationStatus: company.verificationStatus,
            // Scraping metrics
            jobsPosted: company.jobsPosted,
            jobsScraped: company.jobsScraped,
            scrapeRate: company.jobsPosted > 0 ? ((company.jobsScraped / company.jobsPosted) * 100).toFixed(2) : '0',
            lastScrapedAt: company.lastScrapedAt,
            nextScrapeAt: company.nextScrapeAt,
            // Quality metrics
            dataQualityScore: company.dataQualityScore,
            averageSalaryDataQuality: company.averageSalaryDataQuality,
            averageDescriptionLength: company.averageDescriptionLength,
            // Activity metrics
            totalApplications: company.totalApplications,
            activeJobs: company.activeJobs,
            // Status
            blacklistedFromScraping: company.blacklistedFromScraping,
            scraperPriority: company.scraperPriority,
            // Timestamps
            createdAt: company.createdAt,
            verifiedAt: company.verifiedAt,
            updatedAt: company.updatedAt
        };
        res.status(200).json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Error fetching company analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company analytics'
        });
    }
}
// Get company statistics summary
async function getCompanyStatistics(req, res) {
    try {
        const [totalCompanies, verifiedCompanies, pendingCompanies, rejectedCompanies, blacklistedCompanies, highPriorityCompanies, averageQualityScore] = await Promise.all([
            Company_1.Company.countDocuments(),
            Company_1.Company.countDocuments({ verificationStatus: 'verified' }),
            Company_1.Company.countDocuments({ status: 'pending' }),
            Company_1.Company.countDocuments({ status: 'rejected' }),
            Company_1.Company.countDocuments({ blacklistedFromScraping: true }),
            Company_1.Company.countDocuments({ scraperPriority: 'high' }),
            Company_1.Company.aggregate([
                { $group: { _id: null, avg: { $avg: '$dataQualityScore' } } }
            ])
        ]);
        res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                verifiedCompanies,
                pendingCompanies,
                rejectedCompanies,
                blacklistedCompanies,
                highPriorityCompanies,
                verificationRate: totalCompanies > 0 ? ((verifiedCompanies / totalCompanies) * 100).toFixed(2) : '0',
                averageQualityScore: averageQualityScore[0]?.avg?.toFixed(2) || '0'
            }
        });
    }
    catch (error) {
        console.error('Error fetching company statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company statistics'
        });
    }
}
// Update company scraping metrics
async function updateScrapingMetrics(req, res) {
    try {
        const { id } = req.params;
        const { jobsPosted, jobsScraped, dataQualityScore, averageSalaryDataQuality, averageDescriptionLength, activeJobs, totalApplications } = req.body;
        const company = await Company_1.Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        const before = company.toObject();
        if (jobsPosted !== undefined)
            company.jobsPosted = jobsPosted;
        if (jobsScraped !== undefined)
            company.jobsScraped = jobsScraped;
        if (dataQualityScore !== undefined)
            company.dataQualityScore = Math.max(0, Math.min(100, dataQualityScore));
        if (averageSalaryDataQuality !== undefined)
            company.averageSalaryDataQuality = Math.max(0, Math.min(100, averageSalaryDataQuality));
        if (averageDescriptionLength !== undefined)
            company.averageDescriptionLength = averageDescriptionLength;
        if (activeJobs !== undefined)
            company.activeJobs = activeJobs;
        if (totalApplications !== undefined)
            company.totalApplications = totalApplications;
        company.lastScrapedAt = new Date();
        company.lastUpdatedBy = req.user?.id;
        await company.save();
        // Log activity
        await AdminActivityLog_1.AdminActivityLog.create({
            adminId: req.user?.id,
            action: 'UPDATE_SCRAPING_METRICS',
            resource: 'Company',
            resourceId: company._id,
            changes: { before, after: company.toObject() },
            severity: 'LOW',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        res.status(200).json({
            success: true,
            data: company,
            message: 'Scraping metrics updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating scraping metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update scraping metrics'
        });
    }
}
