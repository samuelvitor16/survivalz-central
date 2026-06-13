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

const displayUserName = (user = {}) => {
  const sampNick = String(user.sampNick || "").trim();
  const legacyName = String(user.name || "").trim();

  return sampNick || legacyName || "Sobrevivente";
};

const displayInitial = (user = {}) => {
  return displayUserName(user).charAt(0).toUpperCase();
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

const sanitizeSize = (value) => {
  const size = parseInt(value, 10);

  if ([12, 15, 20, 28].includes(size)) {
    return size;
  }

  return null;
};

const extractYouTubeId = (value) => {
  const text = String(value || "").trim();

  if (!text) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const url = new URL(text);

    if (url.hostname.includes("youtu.be")) {
      const possibleId = url.pathname.replace("/", "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(possibleId) ? possibleId : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");

      if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
        return watchId;
      }

      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);

      if (embedMatch) {
        return embedMatch[1];
      }
    }
  } catch (error) {
    return null;
  }

  return null;
};

const normalizeForumBBCode = (value) => {
  return String(value || "")
    .replace(/\[\/size=[^\]]+\]/gi, "[/size]")
    .replace(/\[\/color=[^\]]+\]/gi, "[/color]")
    .replace(/\[size=(\d+px)\]/gi, (match, size) => {
      return `[size=${parseInt(size, 10)}]`;
    });
};

const renderFormattedUserText = (value) => {
  let output = escapeHtml(normalizeForumBBCode(value));

  output = output.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  output = output.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  output = output.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  output = output.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");

  output = output.replace(/\[size=([^\]\s]+)\]([\s\S]*?)\[\/size\]/gi, (match, size, content) => {
    const safeSize = sanitizeSize(size);
    return safeSize ? `<span style="font-size:${safeSize}px">${content}</span>` : content;
  });

  output = output.replace(/\[color=([^\]\s]+)\]([\s\S]*?)\[\/color\]/gi, (match, color, content) => {
    const safeColor = sanitizeColor(color);
    return safeColor ? `<span style="color:${safeColor}">${content}</span>` : content;
  });

  output = output.replace(/\[glow\]([\s\S]*?)\[\/glow\]/gi, "<span class=\"bb-glow\">$1</span>");
  output = output.replace(/\[shadow\]([\s\S]*?)\[\/shadow\]/gi, "<span class=\"bb-shadow\">$1</span>");
  output = output.replace(/\[title\]([\s\S]*?)\[\/title\]/gi, "<div class=\"bb-title\">$1</div>");

  output = output.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, "<div class=\"bb-center\">$1</div>");
  output = output.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, "<div class=\"bb-right\">$1</div>");

  output = output.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class=\"bb-quote\">$1</blockquote>");

  output = output.replace(
    /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    "<details class=\"bb-spoiler\"><summary>Spoiler</summary><div>$1</div></details>"
  );

  output = output.replace(/\[box=(note|alert|success|danger)\]([\s\S]*?)\[\/box\]/gi, (match, type, content) => {
    return `<div class="bb-box bb-box-${type}">${content}</div>`;
  });

  output = output.replace(/\[hr\]/gi, "<hr class=\"bb-hr\">");

  output = output.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (match, content) => {
    const items = content
      .split("[*]")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `<li>${item}</li>`)
      .join("");

    return `<ul class="bb-list">${items}</ul>`;
  });

  output = output.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, (match, content) => {
    const items = content
      .split("[*]")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `<li>${item}</li>`)
      .join("");

    return `<ol class="bb-list">${items}</ol>`;
  });

  output = output.replace(/\[url\]([^\]\s"'<>]+)\[\/url\]/gi, (match, url) => {
    const safeUrl = url.trim();

    return isSafeForumUrl(safeUrl)
      ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`
      : match;
  });

  output = output.replace(/\[url=([^\]\s"'<>]+)\]([\s\S]*?)\[\/url\]/gi, (match, url, label) => {
    const safeUrl = url.trim();

    return isSafeForumUrl(safeUrl)
      ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`
      : label;
  });

  output = output.replace(/\[img\]([^\]\s"'<>]+)\[\/img\]/gi, (match, url) => {
    const safeUrl = url.trim();

    return isSafeImageUrl(safeUrl)
      ? `<img class="bb-image" src="${safeUrl}" alt="Imagem enviada pelo usuário" loading="lazy">`
      : "";
  });

  output = output.replace(/\[youtube\]([\s\S]*?)\[\/youtube\]/gi, (match, value) => {
    const id = extractYouTubeId(value);

    return id
      ? `<div class="bb-youtube"><iframe src="https://www.youtube.com/embed/${id}" title="Vídeo do YouTube" loading="lazy" allowfullscreen></iframe></div>`
      : "";
  });

  return output.replace(/\r\n|\r|\n/g, "<br>");
};

const plainTextExcerpt = (value, maxLength = 150) => {
  const text = String(value || "")
    .replace(/\[youtube\][\s\S]*?\[\/youtube\]/gi, "")
    .replace(/\[img\][\s\S]*?\[\/img\]/gi, "")
    .replace(/\[(\/)?(b|i|u|s|center|right|quote|spoiler|color|url|size|glow|shadow|title|box|list|olist)(=[^\]]+)?\]/gi, "")
    .replace(/\[hr\]/gi, "")
    .replace(/\[\*\]/g, " ")
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

const ROLE_ALIASES = {
  PLAYER: "SOBREVIVENTE",
  OWNER: "DESENVOLVEDOR",
  ADMIN: "ADMINISTRADOR",
  STAFF: "SUPORTE"
};

const ROLE_CONFIG = {
  SOBREVIVENTE: {
    label: "Sobrevivente",
    display: "☣ Sobrevivente",
    power: 0,
    group: "comunidade"
  },

  PREMIUM: {
    label: "Premium",
    display: "💎 Premium",
    power: 0.1,
    group: "comunidade"
  },

  BETA_TESTER: {
    label: "Beta Tester",
    display: "🧪 Beta Tester",
    power: 0.2,
    group: "comunidade"
  },

  YOUTUBER: {
    label: "YouTuber",
    display: "▶️ YouTuber",
    power: 0.3,
    group: "comunidade"
  },

  SUPORTE: {
    label: "Suporte",
    display: "🎧 Suporte",
    power: 1,
    group: "operacional"
  },

  ESTAGIARIO: {
    label: "Estagiário",
    display: "🧪 Estagiário",
    power: 2,
    group: "operacional"
  },

  MODERADOR: {
    label: "Moderador",
    display: "⚔ Moderador",
    power: 3,
    group: "operacional"
  },

  ADMINISTRADOR: {
    label: "Administrador",
    display: "🛡 Administrador",
    power: 4,
    group: "operacional"
  },

  SUPERVISOR: {
    label: "Supervisor",
    display: "👁 Supervisor",
    power: 5,
    group: "operacional"
  },

  COORDENADOR: {
    label: "Coordenador",
    display: "📌 Coordenador",
    power: 6,
    group: "operacional"
  },

  GERENTE: {
    label: "Gerente",
    display: "💼 Gerente",
    power: 2000,
    group: "tecnica"
  },

  SUB_DIRETOR: {
    label: "Sub-Diretor",
    display: "⭐ Sub-Diretor",
    power: 2001,
    group: "tecnica"
  },

  DIRETOR: {
    label: "Diretor",
    display: "👑 Diretor",
    power: 2002,
    group: "tecnica"
  },

  DESENVOLVEDOR: {
    label: "Desenvolvedor",
    display: "💻 Desenvolvedor",
    power: 5000,
    group: "desenvolvimento"
  }
};

const normalizeRole = (role) => {
  const normalizedInput = String(role || "").trim().toUpperCase();
  return ROLE_ALIASES[normalizedInput] || normalizedInput || "SOBREVIVENTE";
};

const roleClass = (role) => normalizeRole(role).toLowerCase();

const rolePower = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_CONFIG[normalizedRole] ? ROLE_CONFIG[normalizedRole].power : 0;
};

const roleGroup = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_CONFIG[normalizedRole] ? ROLE_CONFIG[normalizedRole].group : "comunidade";
};

const roleLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_CONFIG[normalizedRole] ? ROLE_CONFIG[normalizedRole].label : "Sobrevivente";
};

const roleDisplayLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_CONFIG[normalizedRole] ? ROLE_CONFIG[normalizedRole].display : "☣ Sobrevivente";
};

const isStaffRole = (role) => rolePower(role) >= 1;



const medalRarityLabel = (rarity) => {
  const labels = {
    COMMON: "Comum",
    RARE: "Rara",
    EPIC: "Épica",
    LEGENDARY: "Lendária",
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
  if (!date) return "Não informado";
  return new Date(date).toLocaleDateString("pt-BR");
};

const formatDateTime = (date) => {
  if (!date) return "Não informado";

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
    clan: user.clanName || "Sem clã/facção",
    kills: user.kills ?? 0,
    deaths: user.deaths ?? 0,
    playtime: user.playtimeMinutes
      ? `${Math.floor(user.playtimeMinutes / 60)}h ${user.playtimeMinutes % 60}min`
      : "0h",
    lastGameLogin: user.lastGameLogin ? formatDateTime(user.lastGameLogin) : "Aguardando sync",
    onlineStatus: user.isOnlineInGame ? "Online" : "Offline"
  };
};

function extractFirstImageFromText(content = "") {
  if (!content) return null;

  const bbcodeMatch = content.match(/\[img\]([\s\S]*?)\[\/img\]/i);

  if (bbcodeMatch && bbcodeMatch[1]) {
    return bbcodeMatch[1].trim();
  }

  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);

  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].trim();
  }

  return null;
}

module.exports = {
  escapeHtml,
  displayInitial,
  displayUserName,
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
  isSafeForumUrl,
  isSafeHttpUrl,
  isSafeImageUrl,
  extractFirstImageFromText,
  normalizeRole,
  roleClass,
  rolePower,
  roleGroup,
  isStaffRole,
  ROLE_CONFIG
};
