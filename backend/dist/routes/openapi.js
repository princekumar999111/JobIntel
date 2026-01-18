"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.get("/openapi.yaml", (_req, res) => {
    const p = path_1.default.resolve(process.cwd(), "docs", "openapi.yaml");
    res.sendFile(p);
});
exports.default = router;
