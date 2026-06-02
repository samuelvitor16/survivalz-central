const express = require("express");
const router = express.Router();

const {
  renderAdminHome,
  renderAdminOrders,
  renderAdminOrderDetails,
  updateAdminOrderStatus,
  renderAdminLogin,
  loginAdmin,
  logoutAdmin
} = require("../controllers/adminController");

const {
  requireAdmin,
  redirectIfAdminLogged
} = require("../middlewares/authMiddleware");

// Login admin
router.get("/login", redirectIfAdminLogged, renderAdminLogin);
router.post("/login", redirectIfAdminLogged, loginAdmin);

// Logout admin
router.get("/logout", logoutAdmin);

// Protege tudo abaixo daqui
router.use(requireAdmin);

// Painel admin
router.get("/", renderAdminHome);
router.get("/pedidos", renderAdminOrders);
router.get("/pedidos/:id", renderAdminOrderDetails);
router.post("/pedidos/:id/status", updateAdminOrderStatus);

module.exports = router;