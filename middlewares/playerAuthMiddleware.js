const STAFF_ROLES = ["STAFF", "ADMIN", "OWNER"];

const requirePlayer = (req, res, next) => {
  if (!req.session.playerId) {
    return res.redirect("/entrar");
  }

  next();
};

const redirectIfPlayerLogged = (req, res, next) => {
  if (req.session.playerId) {
    return res.redirect("/painel");
  }

  next();
};

const requireForumStaff = (req, res, next) => {
  if (!req.session.playerId) {
    return res.redirect("/entrar");
  }

  if (!STAFF_ROLES.includes(req.session.playerRole)) {
    return res.status(403).send("Você não tem permissão para acessar esta área.");
  }

  next();
};

module.exports = {
  requirePlayer,
  redirectIfPlayerLogged,
  requireForumStaff,
  STAFF_ROLES
};