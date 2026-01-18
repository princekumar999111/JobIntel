"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobController_1 = require("../controllers/jobController");
const router = (0, express_1.Router)();
// Log all requests to this router
router.use((req, res, next) => {
    console.log(`Job Route: ${req.method} ${req.path}`);
    next();
});
router.post("/parse", jobController_1.parseJobText);
router.post("/", jobController_1.createJob);
router.get("/", jobController_1.listJobs);
router.get("/:id", jobController_1.getJob);
router.patch("/:id", jobController_1.updateJob);
router.delete("/:id", jobController_1.deleteJob);
router.post("/ingest", jobController_1.ingestJob);
exports.default = router;
