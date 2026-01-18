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
exports.ResumeParser = void 0;
const pdfParse = __importStar(require("pdf-parse"));
class ResumeParser {
    /**
     * Extract text from PDF buffer
     */
    static async extractTextFromPDF(buffer) {
        try {
            const data = await pdfParse(buffer);
            return data.text;
        }
        catch (err) {
            throw new Error('Failed to parse PDF');
        }
    }
    /**
     * Parse resume text and extract structured data
     */
    static parseResumeText(text) {
        const lowerText = text.toLowerCase();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        // Extract email
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const emailMatch = text.match(emailRegex);
        const email = emailMatch?.[0];
        // Extract phone
        const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
        const phoneMatch = text.match(phoneRegex);
        const phone = phoneMatch?.[0];
        // Extract name (usually first line or before contact info)
        let name;
        const nameLines = lines.slice(0, 5);
        for (const line of nameLines) {
            if (!line.includes('@') && !line.includes('(') && line.length < 50 && line.split(' ').length <= 4) {
                name = line;
                break;
            }
        }
        // Extract location (look for city, state patterns after contact info section)
        let location;
        // Look for common location indicators in contact section (not the name line)
        const locationPatterns = [
            /(?:location|city|based in|lives in)[:\s]+([A-Za-z\s,]+?)(?:\n|$)/i,
            /(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*(?:[A-Z]{2}|[A-Za-z]+))?)(?:\s*\n\s*(?:\+?[0-9]|[a-zA-Z0-9._%+-]+@))/m,
            /(?:\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\s+([A-Za-z\s,]+?)(?:\n|$)/,
        ];
        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length < 50 && match[1].length > 2) {
                const candidate = match[1].trim();
                // Make sure it's not just the name again
                if (candidate !== name && !candidate.match(/^[a-zA-Z\s]+@/) && candidate.includes(' ') || candidate.includes(',')) {
                    location = candidate;
                    break;
                }
            }
        }
        // If still no location found, try to extract from lines containing common location keywords
        if (!location) {
            for (const line of lines) {
                const lineLower = line.toLowerCase();
                if ((lineLower.includes('india') || lineLower.includes('usa') || lineLower.includes('delhi') ||
                    lineLower.includes('bangalore') || lineLower.includes('mumbai') || lineLower.includes('new york') ||
                    lineLower.includes('san francisco') || lineLower.includes('remote')) &&
                    line !== name && !line.includes('@')) {
                    location = line;
                    break;
                }
            }
        }
        // Extract batch/year (graduation year, degree year)
        let batch;
        const yearRegex = /(?:20\d{2}|19\d{2})(?:\s*-\s*(?:present|current))?/i;
        const yearMatches = text.match(new RegExp(yearRegex, 'g'));
        if (yearMatches && yearMatches.length > 0) {
            const lastYear = yearMatches[yearMatches.length - 1];
            if (lastYear.includes('present') || lastYear.includes('current')) {
                batch = lastYear;
            }
            else {
                batch = yearMatches[0];
            }
        }
        // Extract skills (look for common skill patterns)
        const skills = this.extractSkills(text);
        // Extract summary (first few lines of meaningful content)
        let summary;
        const summaryStart = lines.findIndex(line => !line.includes('@') && !line.includes('phone') && line.length > 20);
        if (summaryStart !== -1) {
            summary = lines.slice(summaryStart, summaryStart + 3).join(' ');
        }
        return {
            skills,
            email,
            phone,
            location,
            name,
            batch,
            summary,
        };
    }
    /**
     * Extract skills from resume text
     */
    static extractSkills(text) {
        const commonSkills = [
            // Programming Languages
            'javascript', 'typescript', 'python', 'java', 'csharp', 'c\\+\\+', 'cpp', 'ruby', 'php', 'go', 'rust', 'kotlin', 'scala', 'r',
            // Frontend
            'react', 'vue', 'angular', 'html', 'css', 'tailwind', 'bootstrap', 'next.js', 'nextjs', 'nuxt', 'svelte',
            // Backend
            'nodejs', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot', 'rails', 'laravel', 'asp.net',
            // Databases
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'sql', 'firestore', 'dynamodb',
            // Tools & Platforms
            'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'gitlab', 'github', 'jenkins', 'ci/cd',
            // Others
            'rest', 'graphql', 'microservices', 'api', 'agile', 'scrum', 'testing', 'jest', 'mocha', 'webpack',
            'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'computer vision',
            'aws lambda', 'serverless', 'firebase', 'realtime database',
            'linux', 'unix', 'bash', 'shell', 'powershell',
            'figma', 'adobe', 'ui/ux', 'design', 'wireframing',
            'data analysis', 'analytics', 'tableau', 'powerbi', 'excel'
        ];
        const lowerText = text.toLowerCase();
        const foundSkills = new Set();
        for (const skill of commonSkills) {
            const skillRegex = new RegExp(`\\b${skill}\\b`, 'gi');
            if (skillRegex.test(lowerText)) {
                // Normalize skill name
                const normalized = this.normalizeSkillName(skill);
                foundSkills.add(normalized);
            }
        }
        return Array.from(foundSkills);
    }
    /**
     * Normalize skill names to standard format
     */
    static normalizeSkillName(skill) {
        const skillMap = {
            'c\\+\\+': 'C++',
            'cpp': 'C++',
            'csharp': 'C#',
            'nodejs': 'Node.js',
            'node.js': 'Node.js',
            'nextjs': 'Next.js',
            'next.js': 'Next.js',
            'spring boot': 'Spring Boot',
            'asp.net': 'ASP.NET',
            'ci/cd': 'CI/CD',
            'graphql': 'GraphQL',
            'rest': 'REST',
            'aws lambda': 'AWS Lambda',
            'ui/ux': 'UI/UX',
        };
        const normalized = skillMap[skill.toLowerCase()] ||
            skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return normalized;
    }
    /**
     * Store parsed data mapping for deletion tracking
     */
    static createParsedDataMapping(parsed) {
        return {
            parsedSkills: parsed.skills,
            parsedProfile: {
                email: parsed.email,
                phone: parsed.phone,
                location: parsed.location,
                name: parsed.name,
                batch: parsed.batch,
            },
        };
    }
}
exports.ResumeParser = ResumeParser;
