const express = require("express");
const router = express.Router();

const {
  renderForumModeration,
  renderReportsModeration,
  renderMedalsModeration,
  awardMedal,
  removeMedal,
  updateTopicStatus
} = require("../controllers/forumModerationController");

const {
  requireForumStaff
} = require("../middlewares/playerAuthMiddleware");

router.get("/", requireForumStaff, renderForumModeration);
router.post("/topico/:id/status", requireForumStaff, updateTopicStatus);
router.get("/denuncias", requireForumStaff, renderReportsModeration);
router.get("/medalhas", requireForumStaff, renderMedalsModeration);
router.post("/medalhas/conceder", requireForumStaff, awardMedal);
router.post("/medalhas/remover", requireForumStaff, removeMedal);

module.exports = router;
