const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const renderUserText = (value) => {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
};

const topicStatusLabel = (status) => {
  const labels = {
    OPEN: "Aberto",
    CLOSED: "Fechado",
    PINNED: "Fixado",
    ARCHIVED: "Arquivado"
  };

  return labels[status] || status || "Aberto";
};

const roleLabel = (role) => {
  const labels = {
    PLAYER: "Jogador",
    STAFF: "Staff",
    ADMIN: "Admin",
    OWNER: "Owner"
  };

  return labels[role] || role || "Jogador";
};

const formatDate = (date) => {
  if (!date) return "Nao informado";
  return new Date(date).toLocaleDateString("pt-BR");
};

const isSafeHttpUrl = (value) => {
  if (!value) return true;

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
};

module.exports = {
  escapeHtml,
  renderUserText,
  topicStatusLabel,
  roleLabel,
  formatDate,
  isSafeHttpUrl
};
