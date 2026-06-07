const prisma = require("../config/prisma");

const validStatuses = ["OPEN", "CLOSED", "PINNED", "ARCHIVED"];

const findUserByLookup = (lookup) => {
  const value = String(lookup || "").trim();

  if (!value) return null;

  return prisma.user.findFirst({
    where: {
      OR: [
        {
          email: value
        },
        {
          sampNick: value
        },
        {
          name: {
            contains: value
          }
        }
      ]
    },
    include: {
      medals: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          medal: true
        }
      }
    }
  });
};

const renderForumModeration = async (req, res) => {
  try {
    const status = validStatuses.includes(req.query.status) ? req.query.status : "ALL";
    const where = status === "ALL" ? {} : { status };

    const topics = await prisma.forumTopic.findMany({
      where,
      orderBy: {
        updatedAt: "desc"
      },
      take: 20,
      include: {
        author: true,
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    const [openReports, usersCount, medalsCount, categories] = await Promise.all([
      prisma.forumTopic.count({
        where: {
          category: {
            slug: "denuncias"
          },
          status: {
            in: ["OPEN", "PINNED"]
          }
        }
      }),
      prisma.user.count(),
      prisma.medal.count(),
      prisma.forumCategory.findMany({
        orderBy: {
          position: "asc"
        }
      })
    ]);

    res.render("pages/forum-moderation", {
      title: "Moderação do Fórum - SurvivalZ",
      topics,
      status,
      categories,
      overview: {
        openReports,
        usersCount,
        medalsCount,
        topicsCount: topics.length
      }
    });
  } catch (error) {
    console.log("Erro ao carregar moderação:", error);
    res.status(500).send("Erro ao carregar moderação.");
  }
};

const updateTopicStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
      return res.redirect("/forum/moderacao");
    }

    await prisma.forumTopic.update({
      where: {
        id
      },
      data: {
        status
      }
    });

    res.redirect("/forum/moderacao");
  } catch (error) {
    console.log("Erro ao atualizar status do tópico:", error);
    res.status(500).send("Erro ao atualizar status.");
  }
};

const renderReportsModeration = async (req, res) => {
  try {
    const status = validStatuses.includes(req.query.status) ? req.query.status : "ALL";
    const statusWhere = status === "ALL" ? {} : { status };

    const reports = await prisma.forumTopic.findMany({
      where: {
        category: {
          slug: "denuncias"
        },
        ...statusWhere
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        author: true,
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    res.render("pages/forum-reports-moderation", {
      title: "Denúncias - Moderação SurvivalZ",
      reports,
      status
    });
  } catch (error) {
    console.log("Erro ao carregar denúncias:", error);
    res.status(500).send("Erro ao carregar denúncias.");
  }
};

const renderMedalsModeration = async (req, res) => {
  try {
    const lookup = req.query.usuario || "";

    const [medals, recentUsers, searchedUser] = await Promise.all([
      prisma.medal.findMany({
        where: {
          isActive: true
        },
        orderBy: [
          {
            rarity: "asc"
          },
          {
            name: "asc"
          }
        ]
      }),
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 8,
        include: {
          medals: {
            take: 4,
            orderBy: {
              createdAt: "desc"
            },
            include: {
              medal: true
            }
          }
        }
      }),
      lookup ? findUserByLookup(lookup) : null
    ]);

    res.render("pages/forum-medals-moderation", {
      title: "Medalhas - Moderacao SurvivalZ",
      medals,
      recentUsers,
      searchedUser,
      lookup,
      error: req.query.erro || null,
      success: req.query.sucesso || null
    });
  } catch (error) {
    console.log("Erro ao carregar painel de medalhas:", error);
    res.status(500).send("Erro ao carregar painel de medalhas.");
  }
};

const awardMedal = async (req, res) => {
  try {
    const { userLookup, medalId, reason } = req.body;
    const user = await findUserByLookup(userLookup);

    if (!user) {
      return res.redirect("/forum/moderacao/medalhas?erro=Usuario nao encontrado");
    }

    const medal = await prisma.medal.findUnique({
      where: {
        id: medalId
      }
    });

    if (!medal) {
      return res.redirect(`/forum/moderacao/medalhas?usuario=${encodeURIComponent(userLookup)}&erro=Medalha nao encontrada`);
    }

    const existingMedal = await prisma.userMedal.findUnique({
      where: {
        userId_medalId: {
          userId: user.id,
          medalId: medal.id
        }
      }
    });

    if (existingMedal) {
      return res.redirect(`/forum/moderacao/medalhas?usuario=${encodeURIComponent(userLookup)}&erro=Usuario ja possui essa medalha`);
    }

    await prisma.userMedal.create({
      data: {
        userId: user.id,
        medalId: medal.id,
        awardedById: req.session.playerId,
        reason: reason ? reason.trim() : null
      }
    });

    res.redirect(`/forum/moderacao/medalhas?usuario=${encodeURIComponent(user.sampNick || user.email)}&sucesso=Medalha concedida`);
  } catch (error) {
    console.log("Erro ao conceder medalha:", error);
    res.redirect("/forum/moderacao/medalhas?erro=Erro ao conceder medalha");
  }
};

const removeMedal = async (req, res) => {
  try {
    const { userLookup, medalId } = req.body;
    const user = await findUserByLookup(userLookup);

    if (!user) {
      return res.redirect("/forum/moderacao/medalhas?erro=Usuario nao encontrado");
    }

    await prisma.userMedal.deleteMany({
      where: {
        userId: user.id,
        medalId
      }
    });

    res.redirect(`/forum/moderacao/medalhas?usuario=${encodeURIComponent(user.sampNick || user.email)}&sucesso=Medalha removida`);
  } catch (error) {
    console.log("Erro ao remover medalha:", error);
    res.redirect("/forum/moderacao/medalhas?erro=Erro ao remover medalha");
  }
};

module.exports = {
  renderForumModeration,
  renderReportsModeration,
  renderMedalsModeration,
  awardMedal,
  removeMedal,
  updateTopicStatus
};
