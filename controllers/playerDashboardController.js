const prisma = require("../config/prisma");
const { getOrdersByUserId } = require("../models/orderModel");

const renderPlayerDashboard = async (req, res) => {
  try {
    const playerId = req.session.playerId;
    const playerOrders = getOrdersByUserId(playerId);
    const recentOrders = [...playerOrders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);

    const [user, topics, reports, recentReplies, repliesCount] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: playerId
        },
        include: {
          medals: {
            take: 6,
            orderBy: {
              createdAt: "desc"
            },
            include: {
              medal: true
            }
          }
        }
      }),

      prisma.forumTopic.findMany({
        where: {
          authorId: playerId,
          category: {
            slug: {
              not: "denuncias"
            }
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

      prisma.forumPost.findMany({
        where: {
          authorId: playerId
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5,
        include: {
          topic: {
            include: {
              category: true
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
      recentReplies,
      repliesCount,
      orderStats: {
        total: playerOrders.length,
        recent: recentOrders.length
      },
      recentOrders
    });
  } catch (error) {
    console.log("Erro ao carregar painel do jogador:", error);
    res.status(500).send("Erro ao carregar painel.");
  }
};

module.exports = {
  renderPlayerDashboard
};
