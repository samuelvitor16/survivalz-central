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

const isSafeForumUrl = (value, { allowUploads = true } = {}) => {
  const url = String(value || "").trim();

  if (!url) return false;

  if (/[\s"'<>]/.test(url)) return false;

  if (allowUploads && url.startsWith("/uploads/")) {
    return !url.includes("\\") && !url.includes("//");
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const isSafeHttpUrl = (value) => isSafeForumUrl(value, { allowUploads: false });

const isSafeImageUrl = (value) => isSafeForumUrl(value);

const sanitizeColor = (value) => {
  const color = String(value || "").trim().toLowerCase();

  if (/^#[0-9a-f]{3}$/i.test(color) || /^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  const legacyColors = new Set([
    "black",
    "blue",
    "cyan",
    "gray",
    "green",
    "grey",
    "lime",
    "magenta",
    "orange",
    "pink",
    "purple",
    "red",
    "silver",
    "white",
    "yellow"
  ]);

  return legacyColors.has(color) ? color : null;
};

const renderFormattedUserText = (value) => {
  let output = escapeHtml(value);

  output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  output = output.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  output = output.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  output = output.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");
  output = output.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, "<div class=\"bb-center\">$1</div>");
  output = output.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, "<div class=\"bb-right\">$1</div>");
  output = output.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class=\"bb-quote\">$1</blockquote>");
  output = output.replace(
    /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    "<details class=\"bb-spoiler\"><summary>Spoiler</summary><div>$1</div></details>"
  );

  output = output.replace(/\[color=([^\]\s]+)\]([\s\S]*?)\[\/color\]/gi, (match, color, content) => {
    const safeColor = sanitizeColor(color);
    return safeColor ? `<span style="color:${safeColor}">${content}</span>` : content;
  });

  output = output.replace(/\[url\]([^\]\s"'<>]+)\[\/url\]/gi, (match, url) => {
    const safeUrl = url.trim();
    return isSafeForumUrl(safeUrl) ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>` : match;
  });

  output = output.replace(/\[url=([^\]\s"'<>]+)\]([\s\S]*?)\[\/url\]/gi, (match, url, label) => {
    const safeUrl = url.trim();
    return isSafeForumUrl(safeUrl) ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });

  output = output.replace(/\[img\]([^\]\s"'<>]+)\[\/img\]/gi, (match, url) => {
    const safeUrl = url.trim();
    return isSafeImageUrl(safeUrl)
      ? `<img class="bb-image" src="${safeUrl}" alt="Imagem enviada pelo usuario" loading="lazy">`
      : "";
  });

  return output.replace(/\r\n|\r|\n/g, "<br>");
};

const plainTextExcerpt = (value, maxLength = 150) => {
  const text = String(value || "")
    .replace(/\[(\/)?(b|i|u|s|center|right|quote|spoiler|color|url|img)(=[^\]]+)?\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}...`;
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

const roleDisplayLabel = (role) => {
  const labels = {
    PLAYER: "☣ PLAYER",
    STAFF: "⚔ STAFF",
    ADMIN: "🛡 ADMIN",
    OWNER: "👑 OWNER"
  };

  return labels[role] || "☣ PLAYER";
};

const medalRarityLabel = (rarity) => {
  const labels = {
    COMMON: "Comum",
    RARE: "Rara",
    EPIC: "Epica",
    LEGENDARY: "Lendaria",
    SPECIAL: "Especial"
  };

  return labels[rarity] || rarity || "Comum";
};

const medalTooltip = (userMedal) => {
  if (!userMedal || !userMedal.medal) return "Medalha SurvivalZ";

  const medal = userMedal.medal;
  const description = medal.description || "Medalha da comunidade SurvivalZ";

  return `${medal.name} - ${description} (${medalRarityLabel(medal.rarity)})`;
};

const formatDate = (date) => {
  if (!date) return "Nao informado";
  return new Date(date).toLocaleDateString("pt-BR");
};

const formatDateTime = (date) => {
  if (!date) return "Nao informado";

  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

const getGameStats = (user = {}) => {
  return {
    zCoins: user.zCoins ?? 0,
    level: user.gameLevel ?? 1,
    xp: user.gameXp ?? 0,
    vip: user.vipTier || "Sem VIP",
    clan: user.clanName || "Sem cla/faccao",
    kills: user.kills ?? 0,
    deaths: user.deaths ?? 0,
    playtime: user.playtimeMinutes ? `${Math.floor(user.playtimeMinutes / 60)}h ${user.playtimeMinutes % 60}min` : "0h",
    lastGameLogin: user.lastGameLogin ? formatDateTime(user.lastGameLogin) : "Aguardando sync",
    onlineStatus: user.isOnlineInGame ? "Online" : "Offline"
  };
};

module.exports = {
  escapeHtml,
  plainTextExcerpt,
  renderUserText,
  renderFormattedUserText,
  topicStatusLabel,
  roleLabel,
  roleDisplayLabel,
  medalRarityLabel,
  medalTooltip,
  formatDate,
  formatDateTime,
  getGameStats,
  isSafeHttpUrl
};
