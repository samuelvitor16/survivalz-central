require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const publicRoutes = require("./routes/publicRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const adminRoutes = require("./routes/adminRoutes");
const shopRoutes = require("./routes/shopRoutes");
const playerRoutes = require("./routes/playerRoutes");
const forumRoutes = require("./routes/forumRoutes");
const forumModerationRoutes = require("./routes/forumModerationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const viewHelpers = require("./utils/viewHelpers");

const { renderNotFound } = require("./controllers/errorController");

const app = express();

const PORT = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || "survivalz_secret_dev";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET precisa estar configurado em producao.");
}

// Configurar EJS como motor de visualização
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
Object.assign(app.locals, viewHelpers);

// Liberar arquivos estáticos: CSS, JS, imagens
app.use(express.static(path.join(__dirname, "public")));

// Permitir receber dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessão do admin
app.set("trust proxy", 1);

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 6
  }
}));

// Variáveis globais para as views
app.use((req, res, next) => {
  res.locals.isAdminLogged = req.session.isAdminLogged || false;

  res.locals.isPlayerLogged = !!req.session.playerId;
  res.locals.currentPlayerId = req.session.playerId || null;
  res.locals.playerName = req.session.playerName || null;
  res.locals.playerRole = req.session.playerRole || null;
  res.locals.playerAvatarUrl = req.session.playerAvatarUrl || null;

  res.locals.discordInvite = process.env.DISCORD_INVITE || "#";
  res.locals.guideLink = process.env.GUIDE_URL || process.env.GUIDE_LINK || "/servidor";

  res.locals.permissionError = null;
  res.locals.privateCategoryMessage = null;

  next();
});

// ================= ROTAS =================

app.use("/", publicRoutes);
app.use("/", playerRoutes);
app.use("/perfil", profileRoutes);
app.use("/denuncias", reportRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/loja", shopRoutes);
app.use("/uploads", uploadRoutes);
app.use("/forum/moderacao", forumModerationRoutes);
app.use("/forum", forumRoutes);




// ================= ERRO 404 =================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "SurvivalZ Central",
    timestamp: new Date().toISOString()
  });
});

const prisma = require("./config/prisma");

app.get("/db-test", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json({
      success: true,
      message: "Banco conectado com sucesso!",
      usersCount: users.length
    });
  } catch (error) {
    console.log("Erro no banco:", error);

    res.status(500).json({
      success: false,
      message: "Erro ao conectar no banco."
    });
  }
});

app.use(renderNotFound);

// ================= SERVIDOR =================

app.listen(PORT, () => {
  console.log(`☣️ Central SurvivalZ rodando em http://localhost:${PORT}`);
});
