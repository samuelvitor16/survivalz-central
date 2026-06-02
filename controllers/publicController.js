const renderHome = (req, res) => {
  res.render("pages/home", {
    title: "Central SurvivalZ"
  });
};

const renderSobre = (req, res) => {
  res.render("pages/sobre", {
    title: "Sobre o SurvivalZ"
  });
};

const renderGestao = (req, res) => {
  res.render("pages/gestao", {
    title: "Gestão SurvivalZ"
  });
};

const renderLogin = (req, res) => {
  res.render("pages/login", {
    title: "Login - Central SurvivalZ"
  });
};

const renderCadastro = (req, res) => {
  res.render("pages/cadastro", {
    title: "Cadastro - Central SurvivalZ"
  });
};

const renderPainel = (req, res) => {
  res.render("pages/painel", {
    title: "Painel do Jogador - Central SurvivalZ"
  });
};

module.exports = {
  renderHome,
  renderSobre,
  renderGestao,
  renderLogin,
  renderCadastro,
  renderPainel
};