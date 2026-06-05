const express = require("express");
const router = express.Router();

const {
  renderHome,
  renderComunidade,
  renderSobre,
  renderGestao,
  renderLogin,
  renderCadastro,
} = require("../controllers/publicController");

router.get("/", renderHome);
router.get("/comunidade", renderComunidade);
router.get("/sobre", renderSobre);
router.get("/gestao", renderGestao);
router.get("/login", renderLogin);
router.get("/cadastro", renderCadastro);


module.exports = router;
