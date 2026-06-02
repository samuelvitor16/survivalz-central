const renderStaffHome = (req, res) => {
  res.render("pages/staff-home", {
    title: "Painel Staff - Central SurvivalZ"
  });
};

const renderStaffReports = (req, res) => {
  res.render("pages/staff-denuncias", {
    title: "Painel Staff - Denúncias"
  });
};

module.exports = {
  renderStaffHome,
  renderStaffReports
};