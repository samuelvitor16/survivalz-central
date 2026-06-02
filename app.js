require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const publicRoutes = require("./routes/publicRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const adminRoutes = require("./routes/adminRoutes");
const shopRoutes = require("./routes/shopRoutes");

const { renderNotFound } = require("./controllers/errorController");

const app = express();

const PORT = 3000;

// Configurar EJS como motor de visualização
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Liberar arquivos estáticos: CSS, JS, imagens
app.use(express.static(path.join(__dirname, "public")));

// Permitir receber dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessão do admin
app.use(session({
  secret: process.env.SESSION_SECRET || "survivalz_secret_dev",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 6
  }
}));

// Variáveis globais para as views
app.use((req, res, next) => {
  res.locals.isAdminLogged = req.session.isAdminLogged || false;
  next();
});

// ================= ROTAS =================

app.use("/", publicRoutes);
app.use("/denuncias", reportRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/loja", shopRoutes);

// ================= ERRO 404 =================

app.use(renderNotFound);

// ================= SERVIDOR =================

app.listen(PORT, () => {
  console.log(`☣️ Central SurvivalZ rodando em http://localhost:${PORT}`);
});