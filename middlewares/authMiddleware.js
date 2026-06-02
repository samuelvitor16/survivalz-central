const requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdminLogged) {
    return next();
  }

  return res.redirect("/admin/login");
};

const redirectIfAdminLogged = (req, res, next) => {
  if (req.session && req.session.isAdminLogged) {
    return res.redirect("/admin");
  }

  return next();
};

module.exports = {
  requireAdmin,
  redirectIfAdminLogged
};