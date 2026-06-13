const express = require("express");
const router = express.Router();
const { onlyDevelopersUntilLaunch } = require("../middlewares/storeAccessMiddleware");

const {
  renderShop,
  renderProduct,
  renderCheckout,
  renderCartCheckout,
  renderSuccess,
  createCheckoutOrder,
  renderOrderConsult,
  searchOrderConsult,
  renderShopTerms
} = require("../controllers/shopController");

router.use(onlyDevelopersUntilLaunch);

router.get("/", renderShop);
router.get("/checkout", renderCartCheckout);
router.post("/checkout", createCheckoutOrder);
router.get("/sucesso", renderSuccess);

router.get("/consultar", renderOrderConsult);
router.post("/consultar", searchOrderConsult);
router.get("/termos", renderShopTerms);

router.get("/produto/:id", renderProduct);
router.get("/comprar/:id", renderCheckout);

module.exports = router;