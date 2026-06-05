const prisma = require("../config/prisma");

const renderPlayerDashboard = async (req, res) => {
  try {
    const playerId = req.session.playerId;

    const [user, topics, reports, repliesCount] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: playerId
        }
      }),

      prisma.forumTopic.findMany({
        where: {
          authorId: playerId
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5,
        include: {
          category: true,
          _count: {
            select: {
              posts: true
            }
          }
        }
      }),

      prisma.forumTopic.findMany({
        where: {
          authorId: playerId,
          category: {
            slug: "denuncias"
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5,
        include: {
          category: true,
          _count: {
            select: {
              posts: true
            }
          }
        }
      }),

      prisma.forumPost.count({
        where: {
          authorId: playerId
        }
      })
    ]);

    res.render("pages/player-dashboard", {
      title: "Meu Painel - SurvivalZ",
      user,
      topics,
      reports,
      repliesCount
    });
  } catch (error) {
    console.log("Erro ao carregar painel do jogador:", error);
    res.status(500).send("Erro ao carregar painel.");
  }
};

module.exports = {
  renderPlayerDashboard
};