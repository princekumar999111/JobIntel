"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentsController_1 = require("../controllers/paymentsController");
const router = (0, express_1.Router)();
router.get('/', paymentsController_1.getPricing);
router.post('/create-order', auth_1.authenticateToken, paymentsController_1.createOrder);
router.post('/verify', auth_1.authenticateToken, paymentsController_1.verifyPayment);
// webhook (no auth)
router.post('/webhook', paymentsController_1.razorpayWebhook);
exports.default = router;
