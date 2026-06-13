const prisma = require("../config/prisma");
const { UserRole } = require("@prisma/client");
const { rolePower } = require("../utils/viewHelpers");

const publicTopicWhere = {
  category: {
    slug: {
      not: "denuncias"
    }
  }
};

const includeTopicCardData = {
  author: true,
  category: true,
  _count: {
    select: {
      posts: true
    }
  }
};

const MEMBER_ROLE_OPTIONS = [
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
const MEMBER_SORT_OPTIONS = ["recent", "reputation", "topics", "posts", "medals"];

const renderHome = async (req, res) => {
  try {
    const homeNewsTopics = await prisma.forumTopic.findMany({
      where: {
        category: {
          slug: {
            in: ["noticias", "changelog"]
          }
        },
        status: {
          in: ["OPEN", "PINNED"]
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 6,
      include: includeTopicCardData
    });

    res.render("pages/home", {
      title: "Central SurvivalZ",
      homeNewsTopics
    });
  } catch (error) {
    console.log("Erro ao carregar home:", error);

    res.render("pages/home", {
      title: "Central SurvivalZ",
      homeNewsTopics: []
    });
  }
};

const getTopicsByCategory = (slug, take = 4) => {
  return prisma.forumTopic.findMany({
    where: {
      category: {
        slug
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    take,
    include: includeTopicCardData
  });
};

const renderComunidade = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTopics,
      totalPosts,
      totalReports,
      recentTopics,
      officialTopics,
      doubtTopics,
      suggestionTopics,
      latestUsers,
      activeUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.forumTopic.count(),
      prisma.forumPost.count(),
      prisma.forumTopic.count({
        where: {
          category: {
            slug: "denuncias"
          }
        }
      }),
      prisma.forumTopic.findMany({
        where: publicTopicWhere,
        orderBy: {
          updatedAt: "desc"
        },
        take: 6,
        include: includeTopicCardData
      }),
      getTopicsByCategory("avisos-oficiais", 4),
      getTopicsByCategory("duvidas", 4),
      getTopicsByCategory("sugestoes", 4),
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 6,
        include: {
          medals: {
            take: 3,
            orderBy: {
              createdAt: "desc"
            },
            include: {
              medal: true
            }
          }
        }
      }),
      prisma.user.findMany({
        take: 12,
        include: {
          _count: {
            select: {
              topics: true,
              posts: true
            }
          }
        }
      })
    ]);

    const rankedUsers = activeUsers
      .map((user) => ({
        ...user,
        activityScore: user._count.topics + user._count.posts
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 6);

    res.render("pages/comunidade", {
      title: "Comunidade - SurvivalZ",
      stats: {
        totalUsers,
        totalTopics,
        totalPosts,
        totalReports
      },
      recentTopics,
      officialTopics,
      doubtTopics,
      suggestionTopics,
      latestUsers,
      activeUsers: rankedUsers
    });
  } catch (error) {
    console.log("Erro ao carregar comunidade:", error);
    res.status(500).send("Erro ao carregar comunidade.");
  }
};

const redirectToForum = (req, res) => {
  res.redirect("/forum");
};

const redirectToServidor = (req, res) => {
  res.redirect("/servidor");
};

const renderMembers = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().slice(0, 80);
    const requestedRole = String(req.query.role || "").trim().toUpperCase();
    const role = MEMBER_ROLE_OPTIONS.includes(requestedRole) ? requestedRole : "";
    const requestedSort = String(req.query.sort || "").trim().toLowerCase();
    const sort = MEMBER_SORT_OPTIONS.includes(requestedSort) ? requestedSort : "recent";
    const supportedDbRoles = new Set(Object.values(UserRole || {}));

    const where = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search
          }
        },
        {
          sampNick: {
            contains: search
          }
        }
      ];
    }

    if (role && supportedDbRoles.has(role)) {
      where.role = role;
    }

    let members = [];

    if (!role || supportedDbRoles.has(role)) {
      members = await prisma.user.findMany({
        where,
        orderBy: sort === "reputation"
          ? [
              {
                reputation: "desc"
              },
              {
                createdAt: "desc"
              }
            ]
          : {
              createdAt: "desc"
            },
        select: {
          id: true,
          name: true,
          sampNick: true,
          avatarUrl: true,
          role: true,
          reputation: true,
          createdAt: true,
          medals: {
            orderBy: {
              createdAt: "desc"
            },
            take: 4,
            select: {
              medal: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  icon: true,
                  rarity: true
                }
              },
              createdAt: true
            }
          },
          _count: {
            select: {
              topics: true,
              posts: true,
              medals: true
            }
          }
        }
      });
    }

    const sortedMembers = [...members].sort((a, b) => {
      if (sort === "topics") {
        return b._count.topics - a._count.topics || b.createdAt - a.createdAt;
      }

      if (sort === "posts") {
        return b._count.posts - a._count.posts || b.createdAt - a.createdAt;
      }

      if (sort === "medals") {
        return b._count.medals - a._count.medals || b.createdAt - a.createdAt;
      }

      if (sort === "reputation") {
        return b.reputation - a.reputation || b.createdAt - a.createdAt;
      }

      return b.createdAt - a.createdAt;
    });

    res.render("pages/members", {
      title: "Membros da Comunidade - SurvivalZ",
      members: sortedMembers,
      filters: {
        search,
        role,
        sort
      },
      roleOptions: MEMBER_ROLE_OPTIONS,
      sortOptions: MEMBER_SORT_OPTIONS
    });
  } catch (error) {
    console.log("Erro ao carregar membros:", error);
    res.status(500).send("Erro ao carregar membros.");
  }
};

const renderTeam = async (req, res) => {
  try {
    const team = await prisma.user.findMany({
      where: {
        role: {
          in: [
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
  "STAFF",
  "ADMIN",
  "OWNER"
]
        }
      },
      orderBy: [
        {
          role: "desc"
        },
        {
          createdAt: "asc"
        }
      ],
      select: {
        id: true,
        name: true,
        sampNick: true,
        avatarUrl: true,
        role: true,
        bio: true,
        medals: {
          orderBy: {
            createdAt: "desc"
          },
          take: 4,
          select: {
            medal: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                rarity: true
              }
            },
            createdAt: true
          }
        }
      }
    });

    res.render("pages/equipe", {
      title: "Equipe - SurvivalZ",
      team: [...team].sort((a, b) => {
        return rolePower(b.role) - rolePower(a.role);
      })
    });
  } catch (error) {
    console.log("Erro ao carregar equipe:", error);
    res.status(500).send("Erro ao carregar equipe.");
  }
};

const renderSobre = (req, res) => {
  res.render("pages/servidor", {
    title: "Servidor - SurvivalZ"
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
  renderComunidade,
  redirectToForum,
  redirectToServidor,
  renderMembers,
  renderTeam,
  renderSobre,
  renderGestao,
  renderLogin,
  renderCadastro,
  renderPainel
};
