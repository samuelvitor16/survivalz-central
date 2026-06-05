const prisma = require("../config/prisma");

const renderPublicProfile = async (req, res) => {
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

    if (!user) {
      return res.status(404).render("pages/404", {
        title: "Perfil não encontrado"
      });
    }

    res.render("pages/profile-public", {
      title: `${user.name} - Perfil SurvivalZ`,
      user
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

    res.render("pages/profile-edit", {
      title: "Editar Perfil - SurvivalZ",
      user,
      error: null,
      success: null
    });
  } catch (error) {
    console.log("Erro ao abrir edição de perfil:", error);
    res.status(500).send("Erro ao abrir edição de perfil.");
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      discord,
      sampNick,
      avatarUrl,
      bannerUrl,
      bio,
      location
    } = req.body;

    if (!name || !discord || !sampNick) {
      const user = await prisma.user.findUnique({
        where: {
          id: req.session.playerId
        }
      });

      return res.render("pages/profile-edit", {
        title: "Editar Perfil - SurvivalZ",
        user,
        error: "Nome, Discord e nick são obrigatórios.",
        success: null
      });
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
      const user = await prisma.user.findUnique({
        where: {
          id: req.session.playerId
        }
      });

      return res.render("pages/profile-edit", {
        title: "Editar Perfil - SurvivalZ",
        user,
        error: "Esse nick já está sendo usado por outra conta.",
        success: null
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.session.playerId
      },
      data: {
        name: name.trim(),
        discord: discord.trim(),
        sampNick: sampNick.trim(),
        avatarUrl: avatarUrl ? avatarUrl.trim() : null,
        bannerUrl: bannerUrl ? bannerUrl.trim() : null,
        bio: bio ? bio.trim() : null,
        location: location ? location.trim() : null
      }
    });

    req.session.playerName = updatedUser.name;

    res.render("pages/profile-edit", {
      title: "Editar Perfil - SurvivalZ",
      user: updatedUser,
      error: null,
      success: "Perfil atualizado com sucesso."
    });
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