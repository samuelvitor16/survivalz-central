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
  redirectIfAdminLogged
} = require("../middlewares/authMiddleware");

const {
  requireAdminRole
} = require("../middlewares/playerAuthMiddleware");

const {
  renderAdminUsers,
  renderAdminUserDetails,
  updateAdminUserRole,
  updateAdminUserTemporaryPassword,
  renderAdminRoles,
  updateAdminRoleQuick
} = require("../controllers/adminUsersController");

const {
  renderAdminStoreProducts,
  renderAdminStoreProductNew,
  createAdminStoreProduct,
  renderAdminStoreProductEdit,
  updateAdminStoreProduct,
  toggleAdminStoreProduct
} = require("../controllers/staffStoreController");

// Login admin
router.get("/login", redirectIfAdminLogged, renderAdminLogin);
router.post("/login", redirectIfAdminLogged, loginAdmin);

// Logout admin
router.get("/logout", logoutAdmin);

// Protege tudo abaixo daqui: apenas ADMIN/OWNER ou sessao dev sem jogador comum.
router.use(requireAdminRole);

// Painel admin
router.get("/", renderAdminHome);
router.get("/cargos", renderAdminRoles);
router.post("/cargos", updateAdminRoleQuick);
router.get("/usuarios", renderAdminUsers);
router.get("/usuarios/:id", renderAdminUserDetails);
router.post("/usuarios/:id/role", updateAdminUserRole);
router.post("/usuarios/:id/password", updateAdminUserTemporaryPassword);
router.get("/pedidos", renderAdminOrders);
router.get("/loja/produtos", renderAdminStoreProducts);
router.get("/loja/produtos/novo", renderAdminStoreProductNew);
router.post("/loja/produtos/novo", createAdminStoreProduct);
router.get("/loja/produtos/:id/editar", renderAdminStoreProductEdit);
router.post("/loja/produtos/:id/editar", updateAdminStoreProduct);
router.post("/loja/produtos/:id/toggle", toggleAdminStoreProduct);

// Exportação precisa vir ANTES de /pedidos/:id
router.get("/pedidos/export/json", exportOrdersJson);
router.get("/pedidos/export/csv", exportOrdersCsv);

router.get("/pedidos/:id", renderAdminOrderDetails);
router.post("/pedidos/:id/status", updateAdminOrderStatus);
router.post("/pedidos/:id/notes", updateAdminOrderNotes);

module.exports = router;
