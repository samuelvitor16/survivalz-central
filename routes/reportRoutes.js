const express = require("express");
const router = express.Router();

const {
  renderReports,
  renderNewReport,
  renderReportDetails
} = require("../controllers/reportController");

router.get("/", renderReports);
router.get("/nova", renderNewReport);
router.get("/:id", renderReportDetails);

module.exports = router;