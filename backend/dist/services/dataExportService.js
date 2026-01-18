"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataExportService = void 0;
const json2csv_1 = require("json2csv");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataExportService {
    exportsDir = path.join(process.cwd(), 'exports');
    constructor() {
        this.ensureExportsDir();
    }
    /**
     * Ensure exports directory exists
     */
    ensureExportsDir() {
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, { recursive: true });
        }
    }
    /**
     * Export jobs to CSV
     */
    async exportToCSV(jobs, fileName) {
        try {
            const fields = [
                'jobId',
                'title',
                'company',
                'location',
                'salary.min',
                'salary.max',
                'salary.currency',
                'employmentType',
                'remote',
                'postedDate',
                'description',
                'applyUrl',
            ];
            const parser = new json2csv_1.Parser({ fields });
            const csv = parser.parse(jobs);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const file = fileName || `jobs_${timestamp}.csv`;
            const filePath = path.join(this.exportsDir, file);
            fs.writeFileSync(filePath, csv);
            return {
                success: true,
                filePath,
                fileName: file,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Export jobs to JSON
     */
    async exportToJSON(jobs, fileName, metadata) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const file = fileName || `jobs_${timestamp}.json`;
            const filePath = path.join(this.exportsDir, file);
            const data = {
                exportedAt: new Date().toISOString(),
                jobCount: jobs.length,
                metadata: metadata || {},
                jobs,
            };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return {
                success: true,
                filePath,
                fileName: file,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Filter jobs by criteria
     */
    filterJobs(jobs, filters) {
        if (!filters)
            return jobs;
        return jobs.filter((job) => {
            if (filters.minSalary && job.salary?.min < filters.minSalary)
                return false;
            if (filters.maxSalary && job.salary?.max > filters.maxSalary)
                return false;
            if (filters.location && !job.location.includes(filters.location))
                return false;
            if (filters.employmentType && job.employmentType !== filters.employmentType)
                return false;
            return true;
        });
    }
    /**
     * Export salary data
     */
    async exportSalaryData(data, fileName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const file = fileName || `salary_data_${timestamp}.csv`;
            const filePath = path.join(this.exportsDir, file);
            const fields = [
                'position',
                'location',
                'experienceLevel',
                'salaryRange.min',
                'salaryRange.max',
                'salaryRange.median',
                'currency',
                'dataSource',
                'sampleSize',
            ];
            const parser = new json2csv_1.Parser({ fields });
            const csv = parser.parse(data);
            fs.writeFileSync(filePath, csv);
            return {
                success: true,
                filePath,
                fileName: file,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Generate salary comparison report
     */
    generateSalaryComparison(salaryData) {
        const byPosition = new Map();
        const byLocation = new Map();
        salaryData.forEach((data) => {
            // Group by position
            if (!byPosition.has(data.position)) {
                byPosition.set(data.position, []);
            }
            byPosition.get(data.position).push(data);
            // Group by location
            if (!byLocation.has(data.location)) {
                byLocation.set(data.location, []);
            }
            byLocation.get(data.location).push(data);
        });
        return {
            totalPositions: byPosition.size,
            totalLocations: byLocation.size,
            byPosition: Object.fromEntries(byPosition),
            byLocation: Object.fromEntries(byLocation),
            generatedAt: new Date().toISOString(),
        };
    }
    /**
     * Get available exports
     */
    getAvailableExports() {
        try {
            return fs.readdirSync(this.exportsDir);
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Delete old exports (older than 7 days)
     */
    cleanupOldExports(daysOld = 7) {
        const now = Date.now();
        const maxAge = daysOld * 24 * 60 * 60 * 1000;
        let deletedCount = 0;
        try {
            const files = fs.readdirSync(this.exportsDir);
            files.forEach((file) => {
                const filePath = path.join(this.exportsDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            });
        }
        catch (error) {
            console.error('Error cleaning up exports:', error);
        }
        return deletedCount;
    }
}
exports.dataExportService = new DataExportService();
