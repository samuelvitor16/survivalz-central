const express = require("express");
const router = express.Router();

const {
  renderPublicProfile,
  renderEditProfile,
  updateProfile
} = require("../controllers/profileController");

const {
  requirePlayer
} = require("../middlewares/playerAuthMiddleware");

router.get("/editar", requirePlayer, renderEditProfile);
router.post("/editar", requirePlayer, updateProfile);

router.get("/:id", renderPublicProfile);

module.exports = router;