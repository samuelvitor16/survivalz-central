const express = require("express");
const router = express.Router();

const {
  renderShop,
  renderProduct,
  renderCheckout,
  renderCartCheckout,
  renderSuccess,
  createCheckoutOrder,
  renderOrderConsult,
  searchOrderConsult
} = require("../controllers/shopController");

router.get("/", renderShop);
router.get("/checkout", renderCartCheckout);
router.post("/checkout", createCheckoutOrder);
router.get("/sucesso", renderSuccess);

router.get("/consultar", renderOrderConsult);
router.post("/consultar", searchOrderConsult);

router.get("/produto/:id", renderProduct);
router.get("/comprar/:id", renderCheckout);

module.exports = router;