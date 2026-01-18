"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileFieldController_1 = require("../controllers/profileFieldController");
const router = (0, express_1.Router)();
router.get('/', profileFieldController_1.getPublicProfileFields);
exports.default = router;
