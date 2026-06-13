const { UserRole } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = require("../config/prisma");
const { getOrdersByUserId } = require("../models/orderModel");
const { formatPrice } = require("../data/products");
const { displayUserName, normalizeRole: normalizeUserRole, rolePower } = require("../utils/viewHelpers");

const REQUESTED_ROLE_OPTIONS = [
  "DESENVOLVEDOR",
  "DIRETOR",
  "SUB_DIRETOR",
  "GERENTE",

  "COORDENADOR",
  "SUPERVISOR",
  "ADMINISTRADOR",
  "MODERADOR",
  "ESTAGIARIO",
  "SUPORTE",

  "YOUTUBER",
  "BETA_TESTER",
  "PREMIUM",
  "SOBREVIVENTE"
];

const SUPPORTED_ROLE_OPTIONS = Object.values(UserRole || {});
const ROLE_UPDATE_OPTIONS = REQUESTED_ROLE_OPTIONS.filter((role) => SUPPORTED_ROLE_OPTIONS.includes(role));
const ROLE_MANAGER_MIN_POWER = 2000;
const SYSTEM_ADMIN_POWER = 9999;
const GERENTE_ASSIGNABLE_ROLES = [
  "SOBREVIVENTE",
  "PREMIUM",
  "BETA_TESTER",
  "YOUTUBER",
  "SUPORTE",
  "ESTAGIARIO",
  "MODERADOR",
  "ADMINISTRADOR"
];

const normalizeRole = (value) => {
  const rawRole = String(value || "").trim();

  if (
    !rawRole ||
    rawRole === "ALL" ||
    rawRole === "TODOS" ||
    rawRole === "TODOS_OS_CARGOS"
  ) {
    return "";
  }

  const role = normalizeUserRole(rawRole);
  return REQUESTED_ROLE_OPTIONS.includes(role) ? role : "";
};

const getActorRole = (req) => {
  if (!req.session) return "PLAYER";

  if (!req.session.playerId && req.session.isAdminLogged) {
    return "DESENVOLVEDOR";
  }

  return req.session.playerRole || "PLAYER";
};

const getActorPower = (req) => {
  if (!req.session) return 0;

  if (!req.session.playerId && req.session.isAdminLogged) {
    return SYSTEM_ADMIN_POWER;
  }

  return rolePower(getActorRole(req));
};

const canManageRoles = (req) => {
  return getActorPower(req) >= ROLE_MANAGER_MIN_POWER;
};

const canManageTargetRole = (req, targetRole) => {
  if (normalizeUserRole(getActorRole(req)) === "GERENTE") {
    return GERENTE_ASSIGNABLE_ROLES.includes(normalizeUserRole(targetRole));
  }

  return getActorPower(req) > rolePower(targetRole);
};

const canAssignRole = (req, nextRole) => {
  if (normalizeUserRole(getActorRole(req)) === "GERENTE") {
    return GERENTE_ASSIGNABLE_ROLES.includes(normalizeUserRole(nextRole));
  }

  return getActorPower(req) > rolePower(nextRole);
};

const getAssignableRoleOptions = (req) => {
  const actorPower = getActorPower(req);

  if (normalizeUserRole(getActorRole(req)) === "GERENTE") {
    return ROLE_UPDATE_OPTIONS.filter((role) => GERENTE_ASSIGNABLE_ROLES.includes(role));
  }

  return ROLE_UPDATE_OPTIONS.filter((role) => actorPower > rolePower(role));
};

const buildUserWhere = ({ search, role }) => {
  const where = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search
        }
      },
      {
        email: {
          contains: search
        }
      },
      {
        sampNick: {
          contains: search
        }
      },
      {
        discord: {
          contains: search
        }
      }
    ];
  }

  if (role && SUPPORTED_ROLE_OPTIONS.includes(role)) {
    where.role = role;
  }

  return where;
};

const userListSelect = {
  id: true,
  name: true,
  email: true,
  sampNick: true,
  discord: true,
  avatarUrl: true,
  role: true,
  reputation: true,
  createdAt: true,
  medals: {
    take: 4,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      medal: true
    }
  },
  _count: {
    select: {
      topics: true,
      posts: true
    }
  }
};

const renderAdminUsers = async (req, res) => {
  try {
    const search = String(req.query.q || "").trim().slice(0, 80);
    const role = normalizeRole(req.query.role);

    const users = role && !SUPPORTED_ROLE_OPTIONS.includes(role)
      ? []
      : await prisma.user.findMany({
          where: buildUserWhere({ search, role }),
          orderBy: {
            createdAt: "desc"
          },
          take: 100,
          select: userListSelect
        });

    res.render("pages/admin-users", {
      title: "Usuarios - Painel Admin",
      users,
      search,
      role,
      roleOptions: REQUESTED_ROLE_OPTIONS,
      supportedRoleOptions: SUPPORTED_ROLE_OPTIONS,
      assignableRoleOptions: getAssignableRoleOptions(req),
      error: req.query.erro || null,
      success: req.query.sucesso || null
    });
  } catch (error) {
    console.log("Erro ao carregar usuarios admin:", error);
    res.status(500).send("Erro ao carregar usuarios.");
  }
};

const renderAdminUserDetails = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id
      },
      select: {
        ...userListSelect,
        bio: true,
        location: true,
        bannerUrl: true,
        signatureText: true,
        signatureImageUrl: true,
        isBanned: true,
        updatedAt: true,
        medals: {
          orderBy: {
            createdAt: "desc"
          },
          include: {
            medal: true,
            awardedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        topics: {
          orderBy: {
            updatedAt: "desc"
          },
          take: 8,
          include: {
            category: true,
            _count: {
              select: {
                posts: true
              }
            }
          }
        },
        posts: {
          orderBy: {
            createdAt: "desc"
          },
          take: 8,
          include: {
            topic: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).render("pages/404", {
        title: "Usuario nao encontrado - Central SurvivalZ"
      });
    }

    const linkedOrders = getOrdersByUserId(user.id)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.render("pages/admin-user-details", {
      title: `${displayUserName(user)} - Usuario Admin`,
      user,
      linkedOrders,
      roleOptions: getAssignableRoleOptions(req),
      supportedRoleOptions: SUPPORTED_ROLE_OPTIONS,
      canManageThisUserRole: canManageTargetRole(req, user.role),
      formatPrice,
      error: req.query.erro || null,
      success: req.query.sucesso || null
    });
  } catch (error) {
    console.log("Erro ao carregar detalhe do usuario:", error);
    res.status(500).send("Erro ao carregar usuario.");
  }
};

const changeUserRole = async (req, id, nextRole) => {
  if (!canManageRoles(req)) {
    return {
      ok: false,
      message: "Voce nao tem permissao para alterar cargos."
    };
  }

  if (!nextRole || !SUPPORTED_ROLE_OPTIONS.includes(nextRole)) {
    return {
      ok: false,
      message: "Cargo invalido ou indisponivel no schema atual"
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      role: true
    }
  });

  if (!user) {
    return {
      ok: false,
      message: "Usuario nao encontrado"
    };
  }

  if (req.session && req.session.playerId && req.session.playerId === user.id) {
    return {
      ok: false,
      message: "Voce nao pode alterar o proprio cargo."
    };
  }

  if (!canManageTargetRole(req, user.role)) {
    return {
      ok: false,
      message: "Voce nao pode alterar cargo de alguem com cargo igual ou superior ao seu."
    };
  }

  if (!canAssignRole(req, nextRole)) {
    return {
      ok: false,
      message: "Voce nao pode atribuir um cargo igual ou superior ao seu."
    };
  }

  if (user.role === "DESENVOLVEDOR" && nextRole !== "DESENVOLVEDOR") {
    const developersCount = await prisma.user.count({
      where: {
        role: "DESENVOLVEDOR"
      }
    });

    if (developersCount <= 1) {
      return {
        ok: false,
        message: "Nao e permitido remover o ultimo Desenvolvedor"
      };
    }
  }

  await prisma.user.update({
    where: {
      id
    },
    data: {
      role: nextRole
    }
  });

  return {
    ok: true,
    message: "Cargo atualizado"
  };
};

const updateAdminUserRole = async (req, res) => {
  try {
    if (!canManageRoles(req)) {
      return res.status(403).send("Voce nao tem permissao para alterar cargos.");
    }

    const { id } = req.params;
    const nextRole = normalizeRole(req.body.role);
    const result = await changeUserRole(req, id, nextRole);

    if (!result.ok) {
      return res.redirect(`/admin/usuarios/${id}?erro=${encodeURIComponent(result.message)}`);
    }

    return res.redirect(`/admin/usuarios/${id}?sucesso=${encodeURIComponent(result.message)}`);
  } catch (error) {
    console.log("Erro ao atualizar cargo do usuario:", error);
    return res.redirect(`/admin/usuarios/${req.params.id}?erro=Erro ao atualizar cargo`);
  }
};

const updateAdminUserTemporaryPassword = async (req, res) => {
  const { id } = req.params;
  const redirectBase = `/admin/usuarios/${id}`;

  try {
    if (!canManageRoles(req)) {
      return res.status(403).send("Voce nao tem permissao para alterar senha.");
    }

    const user = await prisma.user.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        role: true
      }
    });

    if (!user) {
      return res.redirect(`${redirectBase}?erro=${encodeURIComponent("Usuario nao encontrado")}`);
    }

    if (!canManageTargetRole(req, user.role)) {
      return res.redirect(`${redirectBase}?erro=${encodeURIComponent("Voce nao pode alterar senha de alguem com cargo igual ou superior ao seu.")}`);
    }

    const temporaryPassword = String(req.body.temporaryPassword || "");

    if (temporaryPassword.length < 6) {
      return res.redirect(`${redirectBase}?erro=${encodeURIComponent("A senha temporaria precisa ter pelo menos 6 caracteres")}`);
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: {
        id
      },
      data: {
        passwordHash
      }
    });

    return res.redirect(`${redirectBase}?sucesso=${encodeURIComponent("Senha temporaria definida. Informe ao jogador por canal seguro.")}`);
  } catch (error) {
    console.log("Erro ao redefinir senha temporaria:", error);
    return res.redirect(`${redirectBase}?erro=${encodeURIComponent("Erro ao redefinir senha temporaria")}`);
  }
};

const renderAdminRoles = async (req, res) => {
  try {
    const search = String(req.query.q || "").trim().slice(0, 80);
    const users = search
      ? await prisma.user.findMany({
          where: buildUserWhere({ search, role: "" }),
          orderBy: {
            createdAt: "desc"
          },
          take: 12,
          select: userListSelect
        })
      : [];

    res.render("pages/admin-roles", {
      title: "Equipe e cargos - Painel Admin",
      users,
      search,
      roleOptions: getAssignableRoleOptions(req),
      error: req.query.erro || null,
      success: req.query.sucesso || null
    });
  } catch (error) {
    console.log("Erro ao carregar cargos admin:", error);
    res.status(500).send("Erro ao carregar cargos.");
  }
};

const updateAdminRoleQuick = async (req, res) => {
  const search = String(req.body.q || "").trim();
  const redirectBase = `/admin/cargos${search ? `?q=${encodeURIComponent(search)}&` : "?"}`;

  try {
    if (!canManageRoles(req)) {
      return res.status(403).send("Voce nao tem permissao para alterar cargos.");
    }

    const nextRole = normalizeRole(req.body.role);
    const result = await changeUserRole(req, req.body.userId, nextRole);
    const key = result.ok ? "sucesso" : "erro";

    return res.redirect(`${redirectBase}${key}=${encodeURIComponent(result.message)}`);
  } catch (error) {
    console.log("Erro ao atualizar cargo rapido:", error);
    return res.redirect(`${redirectBase}erro=Erro ao atualizar cargo`);
  }
};

module.exports = {
  renderAdminUsers,
  renderAdminUserDetails,
  updateAdminUserRole,
  updateAdminUserTemporaryPassword,
  renderAdminRoles,
  updateAdminRoleQuick,
  REQUESTED_ROLE_OPTIONS,
  SUPPORTED_ROLE_OPTIONS,
  ROLE_UPDATE_OPTIONS
};
