const express = require("express");
const router = express.Router();

const {
  renderAdminHome,
  renderAdminOrders,
  renderAdminOrderDetails,
  updateAdminOrderStatus,
  updateAdminOrderNotes,
  exportOrdersJson,
  exportOrdersCsv,
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

// Exportação precisa vir ANTES de /pedidos/:id
router.get("/pedidos/export/json", exportOrdersJson);
router.get("/pedidos/export/csv", exportOrdersCsv);

router.get("/pedidos/:id", renderAdminOrderDetails);
router.post("/pedidos/:id/status", updateAdminOrderStatus);
router.post("/pedidos/:id/notes", updateAdminOrderNotes);

module.exports = router;