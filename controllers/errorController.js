const renderNotFound = (req, res) => {
  res.status(404).render("pages/404", {
    title: "Página não encontrada - Central SurvivalZ"
  });
};

module.exports = {
  renderNotFound
};