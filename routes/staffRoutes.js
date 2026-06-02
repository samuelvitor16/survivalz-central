const express = require("express");
const router = express.Router();

const {
  renderStaffHome,
  renderStaffReports
} = require("../controllers/staffController");

router.get("/", renderStaffHome);
router.get("/denuncias", renderStaffReports);

module.exports = router;