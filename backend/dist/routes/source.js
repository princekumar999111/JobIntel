"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sourceController_1 = require("../controllers/sourceController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin-protected routes
router.get('/sources', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), sourceController_1.listSources);
router.post('/sources', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), sourceController_1.createSource);
router.get('/sources/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), sourceController_1.getSource);
router.put('/sources/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), sourceController_1.updateSource);
router.delete('/sources/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('admin'), sourceController_1.deleteSource);
exports.default = router;
