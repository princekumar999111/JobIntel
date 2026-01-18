"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applicationController_1 = require("../controllers/applicationController");
const router = (0, express_1.Router)();
router.post("/", applicationController_1.createApplication);
router.get("/", applicationController_1.listApplications);
router.delete("/:id", applicationController_1.deleteApplication);
exports.default = router;
