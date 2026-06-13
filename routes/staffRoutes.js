const express = require("express");
const router = express.Router();

const {
  requireForumStaff
} = require("../middlewares/playerAuthMiddleware");

const {
  renderStaffHome
} = require("../controllers/staffController");

router.get("/", requireForumStaff, renderStaffHome);

router.get("/moderacao", requireForumStaff, (req, res) => {
  res.redirect("/forum/moderacao");
});

router.get("/denuncias", requireForumStaff, (req, res) => {
  res.redirect("/forum/moderacao/denuncias");
});

module.exports = router;