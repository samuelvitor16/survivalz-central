const prisma = require("../config/prisma");
const { isSafeHttpUrl } = require("../utils/viewHelpers");

const PUBLIC_TOPIC_WHERE = {
  category: {
    slug: {
      not: "denuncias"
    }
  }
};

const PROFILE_TABS = ["posts", "sobre", "medalhas", "atividade"];

const renderProfileEdit = async (res, user, error = null, success = null) => {
  return res.render("pages/profile-edit", {
    title: "Editar Perfil - SurvivalZ",
    user,
    error,
    success
  });
};

const renderPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const activeTab = PROFILE_TABS.includes(req.query.tab) ? req.query.tab : "posts";

    const [user, publicTopicsCount, recentPosts] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id
        },
        include: {
          medals: {
            orderBy: {
              createdAt: "desc"
            },
            include: {
              medal: true
            }
          },
          topics: {
            where: PUBLIC_TOPIC_WHERE,
            orderBy: {
              updatedAt: "desc"
            },
            take: 15,
            include: {
              category: true,
              _count: {
                select: {
                  posts: true
                }
              }
            }
          },
          _count: {
            select: {
              topics: true,
              posts: true
            }
          }
        }
      }),
      prisma.forumTopic.count({
        where: {
          authorId: id,
          ...PUBLIC_TOPIC_WHERE
        }
      }),
      prisma.forumPost.findMany({
        where: {
          authorId: id,
          topic: PUBLIC_TOPIC_WHERE
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 10,
        include: {
          topic: {
            include: {
              category: true
            }
          }
        }
      })
    ]);

    if (!user) {
      return res.status(404).render("pages/404", {
        title: "Perfil nao encontrado"
      });
    }

    res.render("pages/profile-public", {
      title: `${user.name} - Perfil SurvivalZ`,
      user,
      activeTab,
      publicTopicsCount,
      recentPosts,
      isOwnProfile: req.session.playerId === user.id
    });
  } catch (error) {
    console.log("Erro ao carregar perfil:", error);
    res.status(500).send("Erro ao carregar perfil.");
  }
};

const renderEditProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.playerId
      }
    });

    if (!user) {
      return res.redirect("/entrar");
    }

    return renderProfileEdit(res, user);
  } catch (error) {
    console.log("Erro ao abrir edicao de perfil:", error);
    res.status(500).send("Erro ao abrir edicao de perfil.");
  }
};

const trimOrNull = (value) => {
  const trimmed = String(value || "").trim();
  return trimmed || null;
};

const isSafeProfileImageUrl = (value) => {
  const trimmed = trimOrNull(value);

  if (!trimmed) return true;

  if (isSafeHttpUrl(trimmed)) return true;

  return /^\/uploads\/profile\/[0-9]+-[a-f0-9]+\.(png|jpg|jpeg|webp|gif)$/i.test(trimmed);
};

const updateProfile = async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: req.session.playerId
      }
    });

    if (!currentUser) {
      return res.redirect("/entrar");
    }

    const {
      name,
      discord,
      sampNick,
      avatarUrl,
      bannerUrl,
      bio,
      location,
      signatureText,
      signatureImageUrl
    } = req.body;

    const formUser = {
      ...currentUser,
      name,
      discord,
      sampNick,
      avatarUrl,
      bannerUrl,
      bio,
      location,
      signatureText,
      signatureImageUrl
    };

    if (!trimOrNull(name) || !trimOrNull(sampNick)) {
      return renderProfileEdit(res, formUser, "Nome publico e nick no servidor sao obrigatorios.");
    }

    const urlsToValidate = [
      ["avatarUrl", avatarUrl],
      ["bannerUrl", bannerUrl],
      ["signatureImageUrl", signatureImageUrl]
    ];

    const hasInvalidUrl = urlsToValidate.some(([, value]) => {
      const trimmed = trimOrNull(value);
      return trimmed && !isSafeProfileImageUrl(trimmed);
    });

    if (hasInvalidUrl) {
      return renderProfileEdit(res, formUser, "Use apenas URLs validas com http://, https:// ou uploads internos do perfil.");
    }

    if (trimOrNull(bio) && bio.trim().length > 800) {
      return renderProfileEdit(res, formUser, "A bio pode ter no maximo 800 caracteres.");
    }

    if (trimOrNull(signatureText) && signatureText.trim().length > 350) {
      return renderProfileEdit(res, formUser, "A assinatura em texto pode ter no maximo 350 caracteres.");
    }

    const existingNick = await prisma.user.findFirst({
      where: {
        sampNick: sampNick.trim(),
        NOT: {
          id: req.session.playerId
        }
      }
    });

    if (existingNick) {
      return renderProfileEdit(res, formUser, "Esse nick ja esta sendo usado por outra conta.");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.session.playerId
      },
      data: {
        name: name.trim().slice(0, 80),
        discord: trimOrNull(discord) ? discord.trim().slice(0, 80) : null,
        sampNick: sampNick.trim().slice(0, 40),
        avatarUrl: trimOrNull(avatarUrl),
        bannerUrl: trimOrNull(bannerUrl),
        bio: trimOrNull(bio),
        location: trimOrNull(location) ? location.trim().slice(0, 80) : null,
        signatureText: trimOrNull(signatureText),
        signatureImageUrl: trimOrNull(signatureImageUrl)
      }
    });

    req.session.playerName = updatedUser.name;

    return renderProfileEdit(res, updatedUser, null, "Perfil atualizado com sucesso.");
  } catch (error) {
    console.log("Erro ao atualizar perfil:", error);
    res.status(500).send("Erro ao atualizar perfil.");
  }
};

module.exports = {
  renderPublicProfile,
  renderEditProfile,
  updateProfile
};
