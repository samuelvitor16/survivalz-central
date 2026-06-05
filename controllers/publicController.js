const prisma = require("../config/prisma");

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

const renderHome = (req, res) => {
  res.render("pages/home", {
    title: "Central SurvivalZ"
  });
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

const renderSobre = (req, res) => {
  res.render("pages/sobre", {
    title: "Sobre o SurvivalZ"
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
  renderSobre,
  renderGestao,
  renderLogin,
  renderCadastro,
  renderPainel
};
