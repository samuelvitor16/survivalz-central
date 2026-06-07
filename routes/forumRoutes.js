const express = require("express");
const router = express.Router();

const {
  renderForumHome,
  renderForumCategory,
  renderNewTopic,
  createTopic,
  renderTopic,
  createReply,
  updateTopicStatusFromTopic,
  moveTopicCategory,
  renderEditTopic,
  updateTopic,
  deleteTopic,
  renderEditPost,
  updatePost,
  deletePost
} = require("../controllers/forumController");

const {
  requirePlayer,
  requireForumStaff
} = require("../middlewares/playerAuthMiddleware");

router.get("/", renderForumHome);

router.get("/topico/:id", renderTopic);
router.get("/topico/:id/editar", requirePlayer, renderEditTopic);
router.post("/topico/:id/editar", requirePlayer, updateTopic);
router.post("/topico/:id/apagar", requirePlayer, deleteTopic);
router.post("/topico/:id/responder", requirePlayer, createReply);
router.post("/topico/:id/status", requireForumStaff, updateTopicStatusFromTopic);
router.post("/topico/:id/mover", requireForumStaff, moveTopicCategory);
router.get("/resposta/:postId/editar", requirePlayer, renderEditPost);
router.post("/resposta/:postId/editar", requirePlayer, updatePost);
router.post("/resposta/:postId/apagar", requirePlayer, deletePost);

router.get("/categoria/:slug", renderForumCategory);
router.get("/categoria/:slug/novo", requirePlayer, renderNewTopic);
router.post("/categoria/:slug/novo", requirePlayer, createTopic);

module.exports = router;
