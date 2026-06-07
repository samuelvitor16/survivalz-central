const prisma = require("../config/prisma");
const STAFF_ROLES = ["STAFF", "ADMIN", "OWNER"];
const isForumStaff = (req) => {
  return STAFF_ROLES.includes(req.session.playerRole);
};

const getCurrentPlayerRole = async (req, res) => {
  if (!req.session.playerId) return req.session.playerRole || null;

  if (STAFF_ROLES.includes(req.session.playerRole)) {
    return req.session.playerRole;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.session.playerId
    },
    select: {
      role: true
    }
  });

  if (!user) return req.session.playerRole || null;

  req.session.playerRole = user.role;

  if (res && res.locals) {
    res.locals.playerRole = user.role;
  }

  return user.role;
};

const isStaffRole = (role) => STAFF_ROLES.includes(role);

const canViewTopic = (req, topic, canManageTopic = isForumStaff(req)) => {
  if (topic.category.slug !== "denuncias") {
    return true;
  }

  if (canManageTopic) {
    return true;
  }

  return req.session.playerId && topic.authorId === req.session.playerId;
};
const canCreateTopicInCategory = (req, category) => {
  if (!req.session.playerId) return false;
  if (category.isLocked) return false;

  if (category.slug === "avisos-oficiais") {
    return STAFF_ROLES.includes(req.session.playerRole);
  }

  return true;
};

const isTopicLockedForPlayer = (topic) => {
  return topic.status === "CLOSED" || topic.status === "ARCHIVED";
};

const canEditTopic = (req, topic) => {
  if (isForumStaff(req)) return true;
  return req.session.playerId === topic.authorId && !isTopicLockedForPlayer(topic);
};

const canDeleteTopic = (req, topic) => {
  if (isForumStaff(req)) return true;
  return req.session.playerId === topic.authorId && !isTopicLockedForPlayer(topic) && topic._count && topic._count.posts === 0;
};

const canEditPost = (req, post) => {
  if (isForumStaff(req)) return true;
  return req.session.playerId === post.authorId && !isTopicLockedForPlayer(post.topic);
};

const canDeletePost = canEditPost;

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
      }
    });

    if (!category) {
      return res.status(404).render("pages/404", {
        title: "Categoria não encontrada"
      });
    }

    const isReportsCategory = category.slug === "denuncias";

    const topicsWhere = isReportsCategory && !isForumStaff(req)
      ? {
          authorId: req.session.playerId || "__not_logged__"
        }
      : {};

    const topics = await prisma.forumTopic.findMany({
      where: {
        categoryId: category.id,
        ...topicsWhere
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        author: true,
        category: true,
        posts: {
          take: 1,
          orderBy: {
            createdAt: "desc"
          },
          include: {
            author: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    res.render("pages/forum-category", {
      title: `${category.name} - Fórum SurvivalZ`,
      category: {
        ...category,
        topics: topics.sort((a, b) => {
          if (a.status === "PINNED" && b.status !== "PINNED") return -1;
          if (a.status !== "PINNED" && b.status === "PINNED") return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        })
      },
      permissionError: req.query.erro === "sem-permissao"
        ? "Você não tem permissão para criar tópico nesta categoria."
        : null,
      privateCategoryMessage: isReportsCategory && !isForumStaff(req)
        ? "Por privacidade, você visualiza apenas as denúncias criadas pela sua própria conta."
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
    const {
  title,
  content,
  reportAccusedNick,
  reportReason,
  reportEvidence
} = req.body;

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

    const isReportCategory = category.slug === "denuncias";

if (isReportCategory) {
  if (!reportAccusedNick || !reportReason || !reportEvidence) {
    return res.render("pages/forum-new-topic", {
      title: `Novo tópico - ${category.name}`,
      category,
      error: "Para criar uma denúncia, informe acusado, motivo e provas.",
      old: req.body
    });
  }

  if (reportAccusedNick.trim().length < 3) {
    return res.render("pages/forum-new-topic", {
      title: `Novo tópico - ${category.name}`,
      category,
      error: "Informe um nick válido para o acusado.",
      old: req.body
    });
  }
}

    const baseSlug = createSlug(title);
    const finalSlug = `${baseSlug}-${Date.now()}`;

    const topic = await prisma.forumTopic.create({
  data: {
    title: title.trim(),
    slug: finalSlug,
    content: content.trim(),

    reportAccusedNick: isReportCategory ? reportAccusedNick.trim() : null,
    reportReason: isReportCategory ? reportReason.trim() : null,
    reportEvidence: isReportCategory ? reportEvidence.trim() : null,

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
        author: {
          include: {
            medals: {
              take: 5,
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
          }
        },

        category: true,
        _count: {
          select: {
            posts: true
          }
        },

        posts: {
          orderBy: {
            createdAt: "asc"
          },
          include: {
            author: {
              include: {
                medals: {
                  take: 5,
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
              }
            }
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    const currentPlayerRole = await getCurrentPlayerRole(req, res);
    const canManageTopic = isStaffRole(currentPlayerRole);

    if (!canViewTopic(req, topic, canManageTopic)) {
      return res.status(403).send("Você não tem permissão para visualizar esta denúncia.");
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

    const categories = canManageTopic
      ? await prisma.forumCategory.findMany({
          orderBy: {
            position: "asc"
          }
        })
      : [];

    res.render("pages/forum-topic", {
      title: `${topic.title} - Fórum SurvivalZ`,
      topic,
      categories,
      currentPlayerId: req.session.playerId || null,
      canManageTopic,
      canEditOwnTopic: canEditTopic(req, topic),
      canDeleteOwnTopic: canDeleteTopic(req, topic),
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

const updateTopicStatusFromTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["OPEN", "CLOSED", "PINNED", "ARCHIVED"];

    if (!validStatuses.includes(status)) {
      return res.redirect(`/forum/topico/${id}`);
    }

    await prisma.forumTopic.update({
      where: {
        id
      },
      data: {
        status
      }
    });

    res.redirect(`/forum/topico/${id}`);
  } catch (error) {
    console.log("Erro ao atualizar status pelo tópico:", error);
    res.status(500).send("Erro ao atualizar status do tópico.");
  }
};

const moveTopicCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    const category = await prisma.forumCategory.findUnique({
      where: {
        id: categoryId
      }
    });

    if (!category) {
      return res.redirect(`/forum/topico/${id}`);
    }

    await prisma.forumTopic.update({
      where: {
        id
      },
      data: {
        categoryId: category.id,
        updatedAt: new Date()
      }
    });

    res.redirect(`/forum/topico/${id}`);
  } catch (error) {
    console.log("Erro ao mover tópico:", error);
    res.status(500).send("Erro ao mover tópico.");
  }
};

const renderEditTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    if (!canEditTopic(req, topic)) {
      return res.status(403).send("Você não tem permissão para editar este tópico.");
    }

    res.render("pages/forum-edit-topic", {
      title: `Editar tópico - ${topic.title}`,
      topic,
      error: null
    });
  } catch (error) {
    console.log("Erro ao abrir edição de tópico:", error);
    res.status(500).send("Erro ao abrir edição de tópico.");
  }
};

const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    if (!canEditTopic(req, topic)) {
      return res.status(403).send("Você não tem permissão para editar este tópico.");
    }

    if (!title || !content || title.trim().length < 5 || content.trim().length < 10) {
      return res.render("pages/forum-edit-topic", {
        title: `Editar tópico - ${topic.title}`,
        topic: {
          ...topic,
          title: title || topic.title,
          content: content || topic.content
        },
        error: "Informe um título com pelo menos 5 caracteres e conteúdo com pelo menos 10."
      });
    }

    await prisma.forumTopic.update({
      where: {
        id
      },
      data: {
        title: title.trim().slice(0, 160),
        content: content.trim(),
        updatedAt: new Date()
      }
    });

    res.redirect(`/forum/topico/${id}`);
  } catch (error) {
    console.log("Erro ao editar tópico:", error);
    res.status(500).send("Erro ao editar tópico.");
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      },
      include: {
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    if (!canDeleteTopic(req, topic)) {
      return res.status(403).send("Você não tem permissão para apagar este tópico.");
    }

    await prisma.forumPost.deleteMany({
      where: {
        topicId: topic.id
      }
    });

    await prisma.forumTopic.delete({
      where: {
        id: topic.id
      }
    });

    res.redirect(`/forum/categoria/${topic.category.slug}`);
  } catch (error) {
    console.log("Erro ao apagar tópico:", error);
    res.status(500).send("Erro ao apagar tópico.");
  }
};

const renderEditPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId
      },
      include: {
        topic: {
          include: {
            category: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).render("pages/404", {
        title: "Resposta não encontrada"
      });
    }

    if (!canEditPost(req, post)) {
      return res.status(403).send("Você não tem permissão para editar esta resposta.");
    }

    res.render("pages/forum-edit-post", {
      title: `Editar resposta - ${post.topic.title}`,
      post,
      error: null
    });
  } catch (error) {
    console.log("Erro ao abrir edição de resposta:", error);
    res.status(500).send("Erro ao abrir edição de resposta.");
  }
};

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId
      },
      include: {
        topic: true
      }
    });

    if (!post) {
      return res.status(404).render("pages/404", {
        title: "Resposta não encontrada"
      });
    }

    if (!canEditPost(req, post)) {
      return res.status(403).send("Você não tem permissão para editar esta resposta.");
    }

    if (!content || content.trim().length < 3) {
      return res.render("pages/forum-edit-post", {
        title: `Editar resposta - ${post.topic.title}`,
        post: {
          ...post,
          content: content || post.content
        },
        error: "A resposta precisa ter pelo menos 3 caracteres."
      });
    }

    await prisma.forumPost.update({
      where: {
        id: post.id
      },
      data: {
        content: content.trim()
      }
    });

    await prisma.forumTopic.update({
      where: {
        id: post.topicId
      },
      data: {
        updatedAt: new Date()
      }
    });

    res.redirect(`/forum/topico/${post.topicId}`);
  } catch (error) {
    console.log("Erro ao editar resposta:", error);
    res.status(500).send("Erro ao editar resposta.");
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId
      },
      include: {
        topic: true
      }
    });

    if (!post) {
      return res.status(404).render("pages/404", {
        title: "Resposta não encontrada"
      });
    }

    if (!canDeletePost(req, post)) {
      return res.status(403).send("Você não tem permissão para apagar esta resposta.");
    }

    await prisma.forumPost.delete({
      where: {
        id: post.id
      }
    });

    await prisma.forumTopic.update({
      where: {
        id: post.topicId
      },
      data: {
        updatedAt: new Date()
      }
    });

    res.redirect(`/forum/topico/${post.topicId}`);
  } catch (error) {
    console.log("Erro ao apagar resposta:", error);
    res.status(500).send("Erro ao apagar resposta.");
  }
};

module.exports = {
  renderForumHome,
  renderForumCategory,
  renderNewTopic,
  createTopic,
  renderTopic,
  createReply,
  updateTopicStatusFromTopic,
  moveTopicCategory,
  renderEditTopic,
  updateTopic,
  deleteTopic,
  renderEditPost,
  updatePost,
  deletePost
};
