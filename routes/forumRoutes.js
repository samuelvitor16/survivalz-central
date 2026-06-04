const express = require("express");
const router = express.Router();

const {
  renderForumHome,
  renderForumCategory,
  renderNewTopic,
  createTopic,
  renderTopic,
  createReply
} = require("../controllers/forumController");

const {
  requirePlayer
} = require("../middlewares/playerAuthMiddleware");

router.get("/", renderForumHome);

router.get("/topico/:id", renderTopic);
router.post("/topico/:id/responder", requirePlayer, createReply);

router.get("/categoria/:slug", renderForumCategory);
router.get("/categoria/:slug/novo", requirePlayer, renderNewTopic);
router.post("/categoria/:slug/novo", requirePlayer, createTopic);

module.exports = router;