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
  requireForumStaff,
  requireAdminRole
} = require("../middlewares/playerAuthMiddleware");

router.get("/", requireForumStaff, (req, res) => {
  const status = req.query.status ? `?status=${encodeURIComponent(req.query.status)}` : "";
  res.redirect(`/staff${status}#staff-moderation`);
});
router.post("/topico/:id/status", requireForumStaff, updateTopicStatus);
router.get("/denuncias", requireForumStaff, renderReportsModeration);
router.get("/medalhas", requireAdminRole, renderMedalsModeration);
router.post("/medalhas/conceder", requireAdminRole, awardMedal);
router.post("/medalhas/remover", requireAdminRole, removeMedal);

module.exports = router;
