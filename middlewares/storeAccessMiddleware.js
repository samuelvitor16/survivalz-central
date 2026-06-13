const { normalizeRole } = require("../utils/viewHelpers");

const STORE_LAUNCH_AT = process.env.STORE_LAUNCH_AT || "2026-06-13T20:00:00-03:00";
const STORE_PUBLIC_ENABLED = String(process.env.STORE_PUBLIC_ENABLED || "false").toLowerCase() === "true";

const isDeveloper = (req) => {
  const role = normalizeRole(req.session?.playerRole || "SOBREVIVENTE");

  return (
    role === "DESENVOLVEDOR" ||
    req.session?.isAdminLogged === true
  );
};

const onlyDevelopersUntilLaunch = (req, res, next) => {
  if (STORE_PUBLIC_ENABLED || isDeveloper(req)) {
    return next();
  }

  return res.status(200).render("pages/loja-em-breve", {
    title: "Loja em breve - SurvivalZ",
    launchAt: STORE_LAUNCH_AT
  });
};

module.exports = {
  onlyDevelopersUntilLaunch
};