const prisma = require("../config/prisma");
const { isStaffRole, rolePower } = require("../utils/viewHelpers");

const STAFF_ROLES = [
  "SUPORTE",
  "ESTAGIARIO",
  "MODERADOR",
  "ADMINISTRADOR",
  "SUPERVISOR",
  "COORDENADOR",
  "GERENTE",
  "SUB_DIRETOR",
  "DIRETOR",
  "DESENVOLVEDOR",

  // Legado temporário
  "STAFF",
  "ADMIN",
  "OWNER"
];

const OFFICIAL_POST_MIN_POWER = 4;
const MODERATION_MIN_POWER = 3;

const getSessionRole = (req) => {
  return req.session && req.session.playerRole ? req.session.playerRole : "PLAYER";
};

const getSessionPower = (req) => {
  return rolePower(getSessionRole(req));
};

const canPostOfficial = (role) => rolePower(role) >= OFFICIAL_POST_MIN_POWER;

const isForumStaff = (req) => {
  return isStaffRole(getSessionRole(req));
};

const canModerateUser = (req, targetUser = {}) => {
  const actorPower = getSessionPower(req);
  const targetPower = rolePower(targetUser.role || "PLAYER");

  return actorPower >= MODERATION_MIN_POWER && actorPower > targetPower;
};

const canModerateTopic = (req, topic = {}) => {
  return canModerateUser(req, topic.author || {});
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

const canViewTopic = (req, topic, canViewPrivateReports = isForumStaff(req)) => {
  if (topic.category.slug !== "denuncias") {
    return true;
  }

  if (canViewPrivateReports) {
    return true;
  }

  return req.session.playerId && topic.authorId === req.session.playerId;
};

const canCreateTopicInCategory = (req, category) => {
  if (!req.session.playerId) return false;
  if (category.isLocked) return false;

  if (["avisos-oficiais", "changelog"].includes(category.slug)) {
    return canPostOfficial(getSessionRole(req));
  }

  return true;
};

const isTopicLockedForPlayer = (topic) => {
  if (!topic) return false;

  return topic.status === "CLOSED" || topic.status === "ARCHIVED";
};

const canEditTopic = (req, topic) => {
  if (req.session.playerId === topic.authorId && !isTopicLockedForPlayer(topic)) {
    return true;
  }

  return canModerateTopic(req, topic);
};

const canDeleteTopic = (req, topic) => {
  if (req.session.playerId === topic.authorId && !isTopicLockedForPlayer(topic)) {
    return topic._count && topic._count.posts === 0;
  }

  return canModerateTopic(req, topic);
};

const canEditPost = (req, post, parentTopic = null) => {
  const topic = post.topic || parentTopic;

  if (req.session.playerId === post.authorId && !isTopicLockedForPlayer(topic)) {
    return true;
  }

  return canModerateUser(req, post.author || {});
};

const canDeletePost = (req, post, parentTopic = null) => {
  return canEditPost(req, post, parentTopic);
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

const extractTopicCoverUrl = (content = "") => {
  const text = String(content || "");
  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /!\[[^\]]*]\(([^)\s]+)\)/i,
    /\[img](.*?)\[\/img]/i,
    /(https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif))/i,
    /(\/uploads\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif))/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const url = match && match[1] ? match[1].trim() : "";

    if (
      url &&
      !/[\s"'<>]/.test(url) &&
      (url.startsWith("/uploads/") || /^https?:\/\//i.test(url))
    ) {
      return url;
    }
  }

  return null;
};

const renderForumHome = async (req, res) => {
  try {
    await getCurrentPlayerRole(req, res);

    const [categories, featuredCandidates, latestTopics, teamMembers, activeUsers] = await Promise.all([
      prisma.forumCategory.findMany({
        orderBy: {
          position: "asc"
        },
        include: {
          topics: {
            orderBy: {
              updatedAt: "desc"
            },
            take: 1,
            include: {
              author: true
            }
          },
          _count: {
            select: {
              topics: true
            }
          }
        }
      }),

      prisma.forumTopic.findMany({
        where: {
          OR: [
            {
              status: "PINNED"
            },
            {
              category: {
                slug: {
                  in: [
                    "avisos-oficiais",
                    "changelog",
                    "sugestoes",
                    "duvidas",
                    "duvidas-resolvidas",
                    "guias-tutoriais",
                    "revisao-de-punicao",
                    "denuncias"
                  ]
                }
              }
            }
          ]
        },
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
      }),

      prisma.forumTopic.findMany({
        where: {
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
          author: true,
          category: true,
          _count: {
            select: {
              posts: true
            }
          }
        }
      }),

      prisma.user.findMany({
        where: {
          role: {
            in: STAFF_ROLES
          }
        },
        select: {
          id: true,
          name: true,
          sampNick: true,
          avatarUrl: true,
          role: true
        }
      }),

      prisma.user.findMany({
        take: 16,
        orderBy: {
          updatedAt: "desc"
        },
        select: {
          id: true,
          name: true,
          sampNick: true,
          avatarUrl: true,
          reputation: true,
          _count: {
            select: {
              topics: true,
              posts: true
            }
          }
        }
      })
    ]);

    const getTopicReplies = (topic) => {
      return Number(topic._count && topic._count.posts ? topic._count.posts : 0);
    };

    const getTopicViews = (topic) => {
      return Number(topic.views || 0);
    };

    const getTopicScore = (topic) => {
      return getTopicViews(topic) + (getTopicReplies(topic) * 12) + (topic.status === "PINNED" ? 80 : 0);
    };

    const isHotTopic = (topic) => {
      return getTopicReplies(topic) >= 3 || getTopicViews(topic) >= 80 || getTopicScore(topic) >= 120;
    };

    const featuredCategoryWeight = {
      "avisos-oficiais": 0,
      changelog: 1,
      sugestoes: 2,
      duvidas: 3,
      "duvidas-resolvidas": 4,
      "guias-tutoriais": 5,
      "revisao-de-punicao": 6,
      denuncias: 7
    };

    const decoratedFeaturedTopics = [...featuredCandidates]
      .map((topic) => ({
        ...topic,
        coverUrl: extractTopicCoverUrl(topic.content),
        hotScore: getTopicScore(topic),
        isHot: isHotTopic(topic)
      }))
      .sort((a, b) => {
        const hotA = a.isHot ? 0 : 1;
        const hotB = b.isHot ? 0 : 1;

        if (hotA !== hotB) return hotA - hotB;

        const pinnedA = a.status === "PINNED" ? 0 : 1;
        const pinnedB = b.status === "PINNED" ? 0 : 1;

        if (pinnedA !== pinnedB) return pinnedA - pinnedB;

        const categoryA = featuredCategoryWeight[a.category.slug] ?? 99;
        const categoryB = featuredCategoryWeight[b.category.slug] ?? 99;

        if (categoryA !== categoryB) return categoryA - categoryB;

        if (b.hotScore !== a.hotScore) return b.hotScore - a.hotScore;

        return new Date(b.updatedAt) - new Date(a.updatedAt);
      })
      .slice(0, 4);

    const rankedUsers = activeUsers
      .map((user) => ({
        ...user,
        activityScore: user._count.topics + user._count.posts + (user.reputation || 0)
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 5);

    const sortedTeamMembers = [...teamMembers]
      .sort((a, b) => {
        const roleDiff = rolePower(b.role) - rolePower(a.role);

        if (roleDiff !== 0) return roleDiff;

        return String(a.sampNick || a.name || "").localeCompare(String(b.sampNick || b.name || ""));
      })
      .slice(0, 5);

    const newTopicCategory =
      categories.find((category) => category.slug === "comunidade") ||
      categories.find((category) => category.slug === "duvidas") ||
      categories.find((category) => !category.isLocked && !category.isPrivate) ||
      null;

    const reportCategory =
      categories.find((category) => category.slug === "denuncias") ||
      categories.find((category) => category.slug === "denuncia") ||
      null;

    res.render("pages/forum-home", {
      title: "Forum - SurvivalZ",
      categories,
      featuredTopics: decoratedFeaturedTopics,
      latestTopics,
      teamMembers: sortedTeamMembers,
      activeUsers: rankedUsers,
      newTopicCategory,
      reportCategory
    });
  } catch (error) {
    console.log("Erro ao carregar forum:", error);
    res.status(500).send("Erro ao carregar forum.");
  }
};

const renderForumCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const currentPlayerRole = await getCurrentPlayerRole(req, res);
    const canViewPrivateReports = isStaffRole(currentPlayerRole);

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

    const topicsWhere = isReportsCategory && !canViewPrivateReports
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
      privateCategoryMessage: isReportsCategory && !canViewPrivateReports
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
    await getCurrentPlayerRole(req, res);
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
    await getCurrentPlayerRole(req, res);
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

    if (!canCreateTopicInCategory(req, category)) {
      return res.redirect(`/forum/categoria/${category.slug}?erro=sem-permissao`);
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
    const canViewPrivateReports = isStaffRole(currentPlayerRole);
    const canManageTopic = canModerateTopic(req, topic);

    if (!canViewTopic(req, topic, canViewPrivateReports)) {
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

    const decoratedTopic = {
      ...topic,
      posts: topic.posts.map((post) => ({
        ...post,
        canEditPost: canEditPost(req, post, topic),
        canDeletePost: canDeletePost(req, post, topic)
      }))
    };

    res.render("pages/forum-topic", {
      title: `${topic.title} - Fórum SurvivalZ`,
      topic: decoratedTopic,
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
    await getCurrentPlayerRole(req, res);
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["OPEN", "CLOSED", "PINNED", "ARCHIVED"];

    if (!validStatuses.includes(status)) {
      return res.redirect(`/forum/topico/${id}`);
    }

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      },
      include: {
        author: true
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    if (!canModerateTopic(req, topic)) {
      return res.status(403).send("Você não tem permissão para alterar este tópico.");
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
    await getCurrentPlayerRole(req, res);
    const { id } = req.params;
    const { categoryId } = req.body;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
      },
      include: {
        author: true
      }
    });

    if (!topic) {
      return res.status(404).render("pages/404", {
        title: "Tópico não encontrado"
      });
    }

    if (!canModerateTopic(req, topic)) {
      return res.status(403).send("Você não tem permissão para mover este tópico.");
    }

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
    await getCurrentPlayerRole(req, res);
    const { id } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
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
    await getCurrentPlayerRole(req, res);
    const { id } = req.params;
    const { title, content } = req.body;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
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
    await getCurrentPlayerRole(req, res);
    const { id } = req.params;

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id
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
    await getCurrentPlayerRole(req, res);
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId
      },
      include: {
        author: true,
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
    await getCurrentPlayerRole(req, res);
    const { postId } = req.params;
    const { content } = req.body;

    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId
      },
      include: {
        author: true,
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
    await getCurrentPlayerRole(req, res);
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId
      },
      include: {
        author: true,
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
