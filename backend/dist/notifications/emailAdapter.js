"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.verifySMTP = verifySMTP;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
let transporter = null;
if (smtpHost && smtpUser) {
    transporter = nodemailer_1.default.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPass } });
}
async function sendEmail(to, subject, text, html) {
    if (!transporter)
        throw new Error("SMTP not configured");
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || smtpUser, to, subject, text, html });
    return info;
}
async function verifySMTP() {
    if (!transporter)
        throw new Error('SMTP not configured');
    return new Promise((resolve, reject) => {
        transporter.verify((err, success) => {
            if (err)
                return reject(err);
            return resolve(!!success);
        });
    });
}
