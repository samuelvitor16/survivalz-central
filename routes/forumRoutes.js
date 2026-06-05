const express = require("express");
const router = express.Router();

const {
  renderForumHome,
  renderForumCategory,
  renderNewTopic,
  createTopic,
  renderTopic,
  createReply,
  updateTopicStatusFromTopic
} = require("../controllers/forumController");

const {
  requirePlayer,
  requireForumStaff
} = require("../middlewares/playerAuthMiddleware");

router.get("/", renderForumHome);

router.get("/topico/:id", renderTopic);
router.post("/topico/:id/responder", requirePlayer, createReply);
router.post("/topico/:id/status", requireForumStaff, updateTopicStatusFromTopic);

router.get("/categoria/:slug", renderForumCategory);
router.get("/categoria/:slug/novo", requirePlayer, renderNewTopic);
router.post("/categoria/:slug/novo", requirePlayer, createTopic);

module.exports = router;