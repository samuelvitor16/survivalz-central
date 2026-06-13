const express = require("express");
const router = express.Router();

const {
  requireForumStaff,
  requireOwnerRole
} = require("../middlewares/playerAuthMiddleware");

const {
  renderStaffHome
} = require("../controllers/staffController");

const {
  renderStaffStoreProducts,
  renderStaffStoreProductNew,
  createStaffStoreProduct,
  renderStaffStoreProductEdit,
  updateStaffStoreProduct,
  toggleStaffStoreProduct
} = require("../controllers/staffStoreController");

router.get("/", requireForumStaff, renderStaffHome);

router.get("/loja", requireOwnerRole, (req, res) => {
  res.redirect("/staff/loja/produtos");
});

router.get("/moderacao", requireForumStaff, (req, res) => {
  res.redirect("/forum/moderacao");
});

router.get("/denuncias", requireForumStaff, (req, res) => {
  res.redirect("/forum/moderacao/denuncias");
});

// Loja — apenas Desenvolvedor/Owner
router.get("/loja/produtos", requireOwnerRole, renderStaffStoreProducts);
router.get("/loja/produtos/novo", requireOwnerRole, renderStaffStoreProductNew);
router.post("/loja/produtos/novo", requireOwnerRole, createStaffStoreProduct);
router.get("/loja/produtos/:id/editar", requireOwnerRole, renderStaffStoreProductEdit);
router.post("/loja/produtos/:id/editar", requireOwnerRole, updateStaffStoreProduct);
router.post("/loja/produtos/:id/toggle", requireOwnerRole, toggleStaffStoreProduct);

module.exports = router;