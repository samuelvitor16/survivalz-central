const renderReports = (req, res) => {
  res.render("pages/denuncias", {
    title: "Denúncias - Central SurvivalZ"
  });
};

const renderNewReport = (req, res) => {
  res.render("pages/nova-denuncia", {
    title: "Nova Denúncia - Central SurvivalZ"
  });
};

const renderReportDetails = (req, res) => {
  res.render("pages/denuncia-detalhes", {
    title: "Detalhes da Denúncia - Central SurvivalZ"
  });
};

module.exports = {
  renderReports,
  renderNewReport,
  renderReportDetails
};