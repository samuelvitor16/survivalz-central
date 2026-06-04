const express = require("express");
const router = express.Router();

const {
  renderForumModeration,
  updateTopicStatus
} = require("../controllers/forumModerationController");

const {
  requireForumStaff
} = require("../middlewares/playerAuthMiddleware");

router.get("/", requireForumStaff, renderForumModeration);
router.post("/topico/:id/status", requireForumStaff, updateTopicStatus);

module.exports = router;