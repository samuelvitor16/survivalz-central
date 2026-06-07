const { UserRole } = require("@prisma/client");

const prisma = require("../config/prisma");
const { getOrdersByUserId } = require("../models/orderModel");
const { formatPrice } = require("../data/products");

const REQUESTED_ROLE_OPTIONS = ["OWNER", "ADMIN", "STAFF", "PLAYER"];
const SUPPORTED_ROLE_OPTIONS = Object.values(UserRole || {});
const ROLE_UPDATE_OPTIONS = REQUESTED_ROLE_OPTIONS.filter((role) => SUPPORTED_ROLE_OPTIONS.includes(role));
const ROLE_MANAGER_OPTIONS = ["ADMIN", "OWNER"];

const normalizeRole = (value) => {
  const role = String(value || "").trim().toUpperCase();
  return REQUESTED_ROLE_OPTIONS.includes(role) ? role : "";
};

const canManageRoles = (req) => {
  if (!req.session) return false;
  if (req.session.playerId) {
    return ROLE_MANAGER_OPTIONS.includes(req.session.playerRole);
  }

  return Boolean(req.session.isAdminLogged);
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
      title: `${user.name} - Usuario Admin`,
      user,
      linkedOrders,
      roleOptions: REQUESTED_ROLE_OPTIONS,
      supportedRoleOptions: SUPPORTED_ROLE_OPTIONS,
      formatPrice,
      error: req.query.erro || null,
      success: req.query.sucesso || null
    });
  } catch (error) {
    console.log("Erro ao carregar detalhe do usuario:", error);
    res.status(500).send("Erro ao carregar usuario.");
  }
};

const changeUserRole = async (id, nextRole) => {
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

  if (user.role === "OWNER" && nextRole !== "OWNER") {
    const ownersCount = await prisma.user.count({
      where: {
        role: "OWNER"
      }
    });

    if (ownersCount <= 1) {
      return {
        ok: false,
        message: "Nao e permitido remover o ultimo OWNER"
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
    const result = await changeUserRole(id, nextRole);

    if (!result.ok) {
      return res.redirect(`/admin/usuarios/${id}?erro=${encodeURIComponent(result.message)}`);
    }

    return res.redirect(`/admin/usuarios/${id}?sucesso=${encodeURIComponent(result.message)}`);
  } catch (error) {
    console.log("Erro ao atualizar cargo do usuario:", error);
    return res.redirect(`/admin/usuarios/${req.params.id}?erro=Erro ao atualizar cargo`);
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
      roleOptions: ROLE_UPDATE_OPTIONS,
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
    const result = await changeUserRole(req.body.userId, nextRole);
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
  renderAdminRoles,
  updateAdminRoleQuick,
  REQUESTED_ROLE_OPTIONS,
  SUPPORTED_ROLE_OPTIONS,
  ROLE_UPDATE_OPTIONS
};
