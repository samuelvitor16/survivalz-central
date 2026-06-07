const prisma = require("../config/prisma");

const STAFF_ROLES = ["STAFF", "ADMIN", "OWNER"];
const ADMIN_ROLES = ["ADMIN", "OWNER"];
const OWNER_ROLES = ["OWNER"];

const refreshSessionRole = async (req, res) => {
  if (!req.session.playerId) {
    return req.session.playerRole || null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.playerId
    },
    select: {
      role: true
    }
  });

  if (!user) return null;

  req.session.playerRole = user.role;

  if (res.locals) {
    res.locals.playerRole = user.role;
  }

  return user.role;
};

const canUseDevPasswordAccess = (req) => {
  if (!req.session || !req.session.isAdminLogged) return false;
  if (!req.session.playerId) return true;

  return ADMIN_ROLES.includes(req.session.playerRole);
};

const requireRole = (roles, options = {}) => {
  const { adminLoginFallback = false } = options;

  return async (req, res, next) => {
    if (!req.session.playerId) {
      if (adminLoginFallback && canUseDevPasswordAccess(req)) {
        return next();
      }

      return res.redirect(adminLoginFallback ? "/admin/login" : "/entrar");
    }

    const role = await refreshSessionRole(req, res);

    if (roles.includes(role)) {
      return next();
    }

    return res.status(403).send("Voce nao tem permissao para acessar esta area.");
  };
};

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

const requireStaffRole = requireRole(STAFF_ROLES);
const requireAdminRole = requireRole(ADMIN_ROLES, { adminLoginFallback: true });
const requireOwnerRole = requireRole(OWNER_ROLES);
const requireForumStaff = requireStaffRole;

module.exports = {
  requirePlayer,
  redirectIfPlayerLogged,
  requireStaffRole,
  requireAdminRole,
  requireOwnerRole,
  requireForumStaff,
  STAFF_ROLES,
  ADMIN_ROLES,
  OWNER_ROLES
};
