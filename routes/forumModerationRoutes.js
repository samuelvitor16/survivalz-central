const express = require("express");
const router = express.Router();

const {
  renderForumModeration,
  renderReportsModeration,
  updateTopicStatus
} = require("../controllers/forumModerationController");

const {
  requireForumStaff
} = require("../middlewares/playerAuthMiddleware");

router.get("/", requireForumStaff, renderForumModeration);
router.post("/topico/:id/status", requireForumStaff, updateTopicStatus);
router.get("/denuncias", requireForumStaff, renderReportsModeration);

module.exports = router;