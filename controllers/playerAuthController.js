const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const FOUNDER_MEDAL = {
  name: "Primeira Geração",
  slug: "fundador",
  description: "Criou sua conta durante o lançamento oficial da SurvivalZ Central.",
  icon: "🏅",
  color: "#ff2b2b",
  rarity: "SPECIAL"
};

const isFounderMedalEnabled = () => {
  return String(process.env.FOUNDER_MEDAL_ENABLED || "").toLowerCase() === "true";
};

const awardFounderMedal = async (userId) => {
  if (!isFounderMedalEnabled()) return;

  const medal = await prisma.medal.upsert({
    where: {
      slug: FOUNDER_MEDAL.slug
    },
    update: FOUNDER_MEDAL,
    create: FOUNDER_MEDAL
  });

  await prisma.userMedal.upsert({
    where: {
      userId_medalId: {
        userId,
        medalId: medal.id
      }
    },
    update: {
      reason: "Conta criada durante o lançamento oficial da SurvivalZ Central."
    },
    create: {
      userId,
      medalId: medal.id,
      reason: "Conta criada durante o lançamento oficial da SurvivalZ Central."
    }
  });
};

const renderRegister = (req, res) => {
  res.render("pages/player-register", {
    title: "Criar Conta - SurvivalZ",
    error: null,
    old: {}
  });
};

const renderRegisterSuccess = (req, res) => {
  res.render("pages/player-register-success", {
    title: "Conta criada - SurvivalZ",
    founderMedalEnabled: isFounderMedalEnabled()
  });
};

const renderForgotPassword = (req, res) => {
  res.render("pages/forgot-password", {
    title: "Esqueci minha senha - SurvivalZ"
  });
};

const registerPlayer = async (req, res) => {
  try {
    const { email, password, discord, sampNick } = req.body;

    if (!email || !password || !discord || !sampNick) {
      return res.render("pages/player-register", {
        title: "Criar Conta - SurvivalZ",
        error: "Preencha todos os campos obrigatórios.",
        old: req.body
      });
    }

    if (password.length < 6) {
      return res.render("pages/player-register", {
        title: "Criar Conta - SurvivalZ",
        error: "A senha precisa ter pelo menos 6 caracteres.",
        old: req.body
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNick = sampNick.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { sampNick: normalizedNick }
        ]
      }
    });

    if (existingUser) {
      return res.render("pages/player-register", {
        title: "Criar Conta - SurvivalZ",
        error: "Já existe uma conta com esse e-mail ou nick.",
        old: req.body
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: normalizedNick,
        email: normalizedEmail,
        passwordHash,
        discord: discord.trim(),
        sampNick: normalizedNick
      }
    });

    req.session.playerId = user.id;
    req.session.playerName = user.sampNick || user.name;
    req.session.playerRole = user.role;
    req.session.playerAvatarUrl = user.avatarUrl || null;

    try {
      await awardFounderMedal(user.id);
    } catch (medalError) {
      console.log("Erro ao conceder medalha fundador:", medalError);
    }

    res.redirect("/cadastrar/sucesso");
  } catch (error) {
    console.log("Erro ao cadastrar jogador:", error);

    res.render("pages/player-register", {
      title: "Criar Conta - SurvivalZ",
      error: "Erro ao criar conta. Tente novamente.",
      old: req.body
    });
  }
};

const renderLogin = (req, res) => {
  res.render("pages/player-login", {
    title: "Entrar - SurvivalZ",
    error: null
  });
};

const loginPlayer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("pages/player-login", {
        title: "Entrar - SurvivalZ",
        error: "Informe e-mail e senha."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase()
      }
    });

    if (!user) {
      return res.render("pages/player-login", {
        title: "Entrar - SurvivalZ",
        error: "E-mail ou senha incorretos."
      });
    }

    if (user.isBanned) {
      return res.render("pages/player-login", {
        title: "Entrar - SurvivalZ",
        error: "Esta conta está bloqueada."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.render("pages/player-login", {
        title: "Entrar - SurvivalZ",
        error: "E-mail ou senha incorretos."
      });
    }

    req.session.playerId = user.id;
    req.session.playerName = user.sampNick || user.name;
    req.session.playerRole = user.role;
    req.session.playerAvatarUrl = user.avatarUrl || null;

    res.redirect(`/perfil/${user.id}`);
  } catch (error) {
    console.log("Erro ao logar jogador:", error);

    res.render("pages/player-login", {
      title: "Entrar - SurvivalZ",
      error: "Erro ao entrar. Tente novamente."
    });
  }
};

const logoutPlayer = (req, res) => {
  req.session.playerId = null;
  req.session.playerName = null;
  req.session.playerRole = null;
  req.session.playerAvatarUrl = null;

  res.redirect("/");
};

module.exports = {
  renderRegister,
  renderRegisterSuccess,
  registerPlayer,
  renderLogin,
  renderForgotPassword,
  loginPlayer,
  logoutPlayer
};
