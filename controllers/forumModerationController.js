const prisma = require("../config/prisma");

const validStatuses = ["OPEN", "CLOSED", "PINNED", "ARCHIVED"];

const renderForumModeration = async (req, res) => {
  try {
    const topics = await prisma.forumTopic.findMany({
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

    res.render("pages/forum-moderation", {
      title: "Moderação do Fórum - SurvivalZ",
      topics
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

module.exports = {
  renderForumModeration,
  updateTopicStatus
};