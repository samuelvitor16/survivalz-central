const prisma = require("../config/prisma");
const STAFF_ROLES = ["STAFF", "ADMIN", "OWNER"];

const canCreateTopicInCategory = (req, category) => {
  if (!req.session.playerId) return false;
  if (category.isLocked) return false;

  if (category.slug === "avisos-oficiais") {
    return STAFF_ROLES.includes(req.session.playerRole);
  }

  return true;
};

const createSlug = (text) => {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const renderForumHome = async (req, res) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: {
        position: "asc"
      },
      include: {
        _count: {
          select: {
            topics: true
          }
        }
      }
    });

    res.render("pages/forum-home", {
      title: "Fórum - SurvivalZ",
      categories
    });
  } catch (error) {
    console.log("Erro ao carregar fórum:", error);
    res.status(500).send("Erro ao carregar fórum.");
  }
};

const renderForumCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.forumCategory.findUnique({
      where: {
        slug
      },
      include: {
        topics: {
          orderBy: {
            updatedAt: "desc"
          },
          include: {
            author: true,
            _count: {
              select: {
                posts: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).render("pages/404", {
        title: "Categoria não encontrada"
      });
    }

    res.render("pages/forum-category", {
      title: `${category.name} - Fórum SurvivalZ`,
      category,
      permissionError: req.query.erro === "sem-permissao"
        ? "Você não tem permissão para criar tópico nesta categoria."
        : null
    });
  } catch (error) {
    console.log("Erro ao carregar categoria:", error);
    res.status(500).send("Erro ao carregar categoria.");
  }
};

const renderNewTopic = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.forumCategory.findUnique({
      where: {
        slug
      }
    });

    if (!category) {
      return res.status(404).render("pages/404", {
        title: "Categoria não encontrada"
      });
    }

    if (!canCreateTopicInCategory(req, category)) {
  return res.redirect(`/forum/categoria/${category.slug}?erro=sem-permissao`);
}
    
    res.render("pages/forum-new-topic", {
      title: `Novo tópico - ${category.name}`,
      category,
      error: null,
      old: {}
    });
  } catch (error) {
    console.log("Erro ao abrir novo tópico:", error);
    res.status(500).send("Erro ao abrir novo tópico.");
  }
};

const createTopic = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;

    const category = await prisma.forumCategory.findUnique({
      where: {
        slug
      }
    });

    if (!category) {
      return res.status(404).render("pages/404", {
        title: "Categoria não encontrada"
      });
    }

    if (!title || !content) {
      return res.render("pages/forum-new-topic", {
        title: `Novo tópico - ${category.name}`,
        category,
        error: "Preencha o título e o conteúdo do tópico.",
        old: req.body
      });
    }

    if (title.trim().length < 5) {
      return res.render("pages/forum-new-topic", {
        title: `Novo tópico - ${category.name}`,
        category,
        error: "O título precisa ter pelo menos 5 caracteres.",
        old: req.body
      });
    }

    if (content.trim().length < 10) {
      return res.render("pages/forum-new-topic", {
        title: `Novo tópico - ${category.name}`,
        category,
        error: "O conteúdo precisa ter pelo menos 10 caracteres.",
        old: req.body
      });
    }

    const baseSlug = createSlug(title);
    const finalSlug = `${baseSlug}-${Date.now()}`;

    const topic = await prisma.forumTopic.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        content: content.trim(),
        authorId: req.session.playerId,
        categoryId: category.id
      }
    });

    res.redirect(`/forum/topico/${topic.id}`);
  } catch (error) {
    console.log("Erro ao criar tópico:", error);
    res.status(500).send("Erro ao criar tópico.");
  }
};

const renderTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      },
      include: {
        author: true,
        category: true,
        posts: {
          orderBy: {
            createdAt: "asc"
          },
          include: {
            author: true
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    await prisma.forumTopic.update({
      where: {
        id: topic.id
      },
      data: {
        views: {
          increment: 1
        }
      }
    });

    res.render("pages/forum-topic", {
  title: `${topic.title} - Fórum SurvivalZ`,
  topic,
  replyError: req.query.erro === "topico-fechado"
    ? "Este tópico está fechado e não aceita novas respostas."
    : null
});
  } catch (error) {
    console.log("Erro ao carregar tópico:", error);
    res.status(500).send("Erro ao carregar tópico.");
  }
};

const createReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    if (topic.status === "CLOSED" || topic.status === "ARCHIVED") {
  return res.redirect(`/forum/topico/${id}?erro=topico-fechado`);
}

    if (!content || content.trim().length < 3) {
      return res.redirect(`/forum/topico/${id}`);
    }

    await prisma.forumPost.create({
      data: {
        content: content.trim(),
        authorId: req.session.playerId,
        topicId: topic.id
      }
    });

    await prisma.forumTopic.update({
      where: {
        id: topic.id
      },
      data: {
        updatedAt: new Date()
      }
    });

    res.redirect(`/forum/topico/${id}`);
  } catch (error) {
    console.log("Erro ao responder tópico:", error);
    res.status(500).send("Erro ao responder tópico.");
  }
};

module.exports = {
  renderForumHome,
  renderForumCategory,
  renderNewTopic,
  createTopic,
  renderTopic,
  createReply
};