const prisma = require("../config/prisma");
const { normalizeRole, rolePower } = require("../utils/viewHelpers");

const STAFF_ROLES = [
  "SUPORTE",
  "ESTAGIARIO",
  "MODERADOR",
  "ADMINISTRADOR",
  "SUPERVISOR",
  "COORDENADOR",
  "GERENTE",
  "SUB_DIRETOR",
  "DIRETOR",
  "DESENVOLVEDOR",

  // Legado temporário
  "STAFF",
  "ADMIN",
  "OWNER"
];

const ADMIN_ROLES = [
  "ADMINISTRADOR",
  "SUPERVISOR",
  "COORDENADOR",
  "GERENTE",
  "SUB_DIRETOR",
  "DIRETOR",
  "DESENVOLVEDOR",

  // Legado temporário
  "ADMIN",
  "OWNER"
];

const OWNER_ROLES = [
  "DESENVOLVEDOR",

  // Legado temporário
  "OWNER"
];

const refreshSessionRole = async (req, res) => {
  if (!req.session.playerId) {
    return req.session.playerRole || null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.playerId
    },
    select: {
      role: true,
      avatarUrl: true,
      name: true,
      sampNick: true
    }
  });

  if (!user) return null;

  req.session.playerRole = user.role;
  req.session.playerName = user.sampNick || user.name;
  req.session.playerAvatarUrl = user.avatarUrl || null;

  if (res.locals) {
    res.locals.playerRole = user.role;
    res.locals.playerName = req.session.playerName;
    res.locals.playerAvatarUrl = req.session.playerAvatarUrl;
  }

  return user.role;
};

const canUseDevPasswordAccess = (req) => {
  if (!req.session || !req.session.isAdminLogged) return false;
  if (!req.session.playerId) return true;

  return rolePower(req.session.playerRole) >= 4;
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

    if (roles.includes(normalizeRole(role))) {
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
    return res.redirect(`/perfil/${req.session.playerId}`);
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
