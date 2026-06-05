const express = require("express");
const router = express.Router();

const {
  renderHome,
  renderSobre,
  renderGestao,
  renderLogin,
  renderCadastro,
} = require("../controllers/publicController");

router.get("/", renderHome);
router.get("/sobre", renderSobre);
router.get("/gestao", renderGestao);
router.get("/login", renderLogin);
router.get("/cadastro", renderCadastro);


module.exports = router;