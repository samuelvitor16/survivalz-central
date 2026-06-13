const express = require("express");
const router = express.Router();

const {
  renderHome,
  renderComunidade,
  redirectToForum,
  redirectToServidor,
  renderMembers,
  renderTeam,
  renderSobre,
  renderGestao,
  renderLogin,
  renderCadastro,
} = require("../controllers/publicController");

router.get("/", renderHome);
router.get("/comunidade", redirectToForum);
router.get("/membros", renderMembers);
router.get("/equipe", renderTeam);
router.get("/servidor", renderSobre);
router.get("/sobre", redirectToServidor);
router.get("/gestao", redirectToServidor);
router.get("/login", renderLogin);
router.get("/cadastro", (req, res) => res.redirect("/cadastrar"));


module.exports = router;
