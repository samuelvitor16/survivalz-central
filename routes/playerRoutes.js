const express = require("express");
const router = express.Router();
const {
  renderPlayerDashboard
} = require("../controllers/playerDashboardController");

const {
  renderPlayerOrders,
  renderPlayerOrderDetails
} = require("../controllers/playerOrdersController");

const {
  renderRegister,
  renderRegisterSuccess,
  registerPlayer,
  renderLogin,
  renderForgotPassword,
  loginPlayer,
  logoutPlayer
} = require("../controllers/playerAuthController");

const {
  requirePlayer,
  redirectIfPlayerLogged
} = require("../middlewares/playerAuthMiddleware");

router.get("/cadastrar", redirectIfPlayerLogged, renderRegister);
router.post("/cadastrar", redirectIfPlayerLogged, registerPlayer);
router.get("/cadastrar/sucesso", requirePlayer, renderRegisterSuccess);

router.get("/entrar", redirectIfPlayerLogged, renderLogin);
router.post("/entrar", redirectIfPlayerLogged, loginPlayer);
router.get("/esqueci-senha", renderForgotPassword);

router.get("/sair", requirePlayer, logoutPlayer);

router.get("/painel", requirePlayer, (req, res) => {
  res.redirect(`/perfil/${req.session.playerId}`);
});
router.get("/painel/pedidos", requirePlayer, renderPlayerOrders);
router.get("/painel/pedidos/:id", requirePlayer, renderPlayerOrderDetails);

module.exports = router;
