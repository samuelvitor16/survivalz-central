const express = require("express");
const router = express.Router();

const {
  renderRegister,
  registerPlayer,
  renderLogin,
  loginPlayer,
  logoutPlayer
} = require("../controllers/playerAuthController");

const {
  requirePlayer,
  redirectIfPlayerLogged
} = require("../middlewares/playerAuthMiddleware");

router.get("/cadastrar", redirectIfPlayerLogged, renderRegister);
router.post("/cadastrar", redirectIfPlayerLogged, registerPlayer);

router.get("/entrar", redirectIfPlayerLogged, renderLogin);
router.post("/entrar", redirectIfPlayerLogged, loginPlayer);

router.get("/sair", requirePlayer, logoutPlayer);

router.get("/painel", requirePlayer, (req, res) => {
  res.render("pages/player-dashboard", {
    title: "Meu Painel - SurvivalZ"
  });
});

module.exports = router;