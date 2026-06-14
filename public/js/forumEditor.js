(function () {
  const previewTimers = new WeakMap();

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeForumBBCode(value) {
  return String(value || "")
    .replace(/\[\/size=[^\]]+\]/gi, "[/size]")
    .replace(/\[\/color=[^\]]+\]/gi, "[/color]")
    .replace(/\[size=(\d+px)\]/gi, function (match, size) {
      return `[size=${parseInt(size, 10)}]`;
    });
}

  function isSafeForumUrl(url, options) {
    const settings = Object.assign({ allowUploads: true }, options || {});
    const value = String(url || "").trim();

    if (!value || /[\s"'<>]/.test(value)) return false;

    if (settings.allowUploads && value.startsWith("/uploads/")) {
      return !value.includes("\\") && !value.includes("//");
    }

    try {
      const parsedUrl = new URL(value);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function isSafeImageUrl(url) {
    return isSafeForumUrl(url);
  }

  function normalizeColor(color) {
    const value = String(color || "").trim().toLowerCase();

    if (/^#[0-9a-f]{3}$/i.test(value) || /^#[0-9a-f]{6}$/i.test(value)) {
      return value;
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

    return legacyColors.has(value) ? value : "#ffffff";
  }

  function normalizeSize(size) {
    const number = parseInt(size, 10);

    if ([12, 15, 20, 28].includes(number)) {
      return number;
    }

    return 15;
  }

  function extractYouTubeId(value) {
    const text = String(value || "").trim();

    if (!text) return null;

    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
      return text;
    }

    try {
      const url = new URL(text);

      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.replace("/", "").trim();
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
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
  }

  function renderBBCode(rawText) {
    let html = escapeHtml(normalizeForumBBCode(rawText));

    html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
    html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
    html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
    html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");

    html = html.replace(/\[size=(12|15|20|28)\]([\s\S]*?)\[\/size\]/gi, function (_, size, content) {
      return `<span style="font-size:${normalizeSize(size)}px">${content}</span>`;
    });

    html = html.replace(/\[color=([^\]\s]+)\]([\s\S]*?)\[\/color\]/gi, function (_, color, content) {
      return `<span style="color:${normalizeColor(color)}">${content}</span>`;
    });

    html = html.replace(/\[glow\]([\s\S]*?)\[\/glow\]/gi, "<span class=\"bb-glow\">$1</span>");
    html = html.replace(/\[shadow\]([\s\S]*?)\[\/shadow\]/gi, "<span class=\"bb-shadow\">$1</span>");
    html = html.replace(/\[title\]([\s\S]*?)\[\/title\]/gi, "<div class=\"bb-title\">$1</div>");

    html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, "<div class=\"bb-center\">$1</div>");
    html = html.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, "<div class=\"bb-right\">$1</div>");

    html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class=\"bb-quote\">$1</blockquote>");

    html = html.replace(
      /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
      "<details class=\"bb-spoiler\"><summary>Spoiler</summary><div>$1</div></details>"
    );

    html = html.replace(/\[box=(note|alert|success|danger)\]([\s\S]*?)\[\/box\]/gi, function (_, type, content) {
      return `<div class="bb-box bb-box-${type}">${content}</div>`;
    });

    html = html.replace(/\[hr\]/gi, "<hr class=\"bb-hr\">");

    html = html.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, function (_, content) {
      const items = content
        .split("[*]")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `<li>${item}</li>`)
        .join("");

      return `<ul class="bb-list">${items}</ul>`;
    });

    html = html.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, function (_, content) {
      const items = content
        .split("[*]")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `<li>${item}</li>`)
        .join("");

      return `<ol class="bb-list">${items}</ol>`;
    });

    html = html.replace(/\[url\]([^\]\s"'<>]+)\[\/url\]/gi, function (match, url) {
      const safeUrl = url.trim();

      return isSafeForumUrl(safeUrl)
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`
        : match;
    });

    html = html.replace(/\[url=([^\]\s"'<>]+)\]([\s\S]*?)\[\/url\]/gi, function (_, url, label) {
      const safeUrl = url.trim();

      return isSafeForumUrl(safeUrl)
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label;
    });

    html = html.replace(/\[img\]([^\]\s"'<>]+)\[\/img\]/gi, function (_, url) {
      const safeUrl = url.trim();

      return isSafeImageUrl(safeUrl)
        ? `<img src="${safeUrl}" alt="Imagem enviada no fórum" class="bb-image" loading="lazy">`
        : "";
    });

    html = html.replace(/\[youtube\]([\s\S]*?)\[\/youtube\]/gi, function (_, value) {
      const id = extractYouTubeId(value);

      return id
        ? `<div class="bb-youtube"><iframe src="https://www.youtube.com/embed/${id}" title="Vídeo do YouTube" loading="lazy" allowfullscreen></iframe></div>`
        : "";
    });

    return html.replace(/\r\n|\r|\n/g, "<br>");
  }

  function getChildrenBBCode(node) {
    let output = "";

    node.childNodes.forEach((child) => {
      output += nodeToBBCode(child);
    });

    return output;
  }

  function getNodeAlign(node) {
    return node.style.textAlign || node.getAttribute("align") || "";
  }

  function getSelectedText(fallback) {
    const selection = window.getSelection();

    if (!selection || !selection.toString().trim()) {
      return fallback;
    }

    return selection.toString();
  }

  function nodeToBBCode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const content = getChildrenBBCode(node);
    const classList = node.classList;
    if (tag === "font") {
  const color = node.getAttribute("color");
  let result = content;

  if (color) {
    result = `[color=${rgbToHex(color)}]${result}[/color]`;
  }

  return result;
}

    if (tag === "br") return "\n";
    if (tag === "hr") return "\n[hr]\n";

    if (tag === "strong" || tag === "b") return `[b]${content}[/b]`;
    if (tag === "em" || tag === "i") return `[i]${content}[/i]`;
    if (tag === "u") return `[u]${content}[/u]`;
    if (tag === "s" || tag === "strike" || tag === "del") return `[s]${content}[/s]`;
    if (tag === "blockquote") return `[quote]${content.trim()}[/quote]\n`;

    if (tag === "ul") return `[list]\n${content}[/list]\n`;
    if (tag === "ol") return `[olist]\n${content}[/olist]\n`;
    if (tag === "li") return `[*]${content.trim()}\n`;

    if (tag === "details") {
      let spoilerContent = "";

      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "summary") {
          return;
        }

        spoilerContent += nodeToBBCode(child);
      });

      return `[spoiler]${spoilerContent.trim()}[/spoiler]`;
    }

    if (tag === "a") {
      const href = node.getAttribute("href");

      return isSafeForumUrl(href) ? `[url=${href}]${content}[/url]` : content;
    }

    if (tag === "img") {
      const src = node.getAttribute("src");

      return isSafeImageUrl(src) ? `[img]${src}[/img]` : "";
    }

    if (classList.contains("bb-youtube")) {
      const id = node.dataset.youtubeId;

      return id ? `[youtube]${id}[/youtube]\n` : "";
    }

    if (classList.contains("bb-title")) return `[title]${content.trim()}[/title]\n`;
    if (classList.contains("bb-glow")) return `[glow]${content}[/glow]`;
    if (classList.contains("bb-shadow")) return `[shadow]${content}[/shadow]`;

    if (classList.contains("bb-box-note")) return `[box=note]${content.trim()}[/box]\n`;
    if (classList.contains("bb-box-alert")) return `[box=alert]${content.trim()}[/box]\n`;
    if (classList.contains("bb-box-success")) return `[box=success]${content.trim()}[/box]\n`;
    if (classList.contains("bb-box-danger")) return `[box=danger]${content.trim()}[/box]\n`;

    if (tag === "span") {
      const color = node.style.color;
      const size = parseInt(node.style.fontSize, 10);
      let result = content;

      if (color) {
        result = `[color=${rgbToHex(color)}]${result}[/color]`;
      }

     if ([12, 15, 20, 28].includes(size)) {
  result = `[size=${size}]${result}[/size]`;
}
      return result;
    }

    if (tag === "div" || tag === "p") {
      const align = getNodeAlign(node);

      if (align === "center" || classList.contains("bb-center")) {
        return `[center]${content.trim()}[/center]\n`;
      }

      if (align === "right" || classList.contains("bb-right")) {
        return `[right]${content.trim()}[/right]\n`;
      }

      return `${content}\n`;
    }

    return content;
  }

  function rgbToHex(color) {
    if (color.startsWith("#")) {
      return normalizeColor(color);
    }

    const match = color.match(/\d+/g);

    if (!match || match.length < 3) {
      return "#ffffff";
    }

    return (
      "#" +
      match
        .slice(0, 3)
        .map((number) => {
          const hex = Number(number).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  function syncEditor(editor) {
    const surface = editor.querySelector(".sz-editor-surface");
    const source = editor.querySelector(".sz-editor-source");

    if (!surface || !source) return;

    source.value = getChildrenBBCode(surface).trim();
  }

  function setEditorHtmlFromBBCode(editor) {
    const surface = editor.querySelector(".sz-editor-surface");
    const source = editor.querySelector(".sz-editor-source");

    if (!surface || !source || !source.value.trim()) return;

    surface.innerHTML = renderBBCode(source.value);
  }

  function getEditorByTextareaId(textareaId) {
    return document.querySelector(`[data-rich-editor][data-editor-for="${textareaId}"]`);
  }

  function getPreviewForEditor(editor) {
    const button = editor.querySelector(".sz-editor-preview-btn");
    const previewId = button ? button.dataset.previewTarget : null;

    return previewId ? document.getElementById(previewId) : null;
  }

  function execEditorCommand(editor, command) {
    const surface = editor.querySelector(".sz-editor-surface");

    if (!surface) return;

    surface.focus();
    document.execCommand(command, false, null);
    syncEditor(editor);
    schedulePreviewUpdate(editor);
  }

  function insertHtml(editor, html) {
    const surface = editor.querySelector(".sz-editor-surface");

    if (!surface) return;

    surface.focus();
    document.execCommand("insertHTML", false, html);
    syncEditor(editor);
    schedulePreviewUpdate(editor);
  }

  function isSelectionInsideEditor(surface) {
  const selection = window.getSelection();

  if (!selection || !selection.rangeCount) return false;

  const node = selection.anchorNode;

  return node && surface.contains(node);
}

function moveCursorAfter(node) {
  const selection = window.getSelection();
  const range = document.createRange();

  range.setStartAfter(node);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
}

function wrapSelectionWith(editor, wrapper, fallbackText) {
  const surface = editor.querySelector(".sz-editor-surface");

  if (!surface) return;

  surface.focus();

  const selection = window.getSelection();

  if (
    !selection ||
    !selection.rangeCount ||
    selection.isCollapsed ||
    !isSelectionInsideEditor(surface)
  ) {
    wrapper.textContent = fallbackText;
    insertHtml(editor, wrapper.outerHTML);
    return;
  }

  const range = selection.getRangeAt(0);
  const selectedContent = range.extractContents();

  wrapper.appendChild(selectedContent);
  range.insertNode(wrapper);

  moveCursorAfter(wrapper);

  syncEditor(editor);
  schedulePreviewUpdate(editor);
}

function applyColor(editor, color) {
  const surface = editor.querySelector(".sz-editor-surface");

  if (!surface) return;

  surface.focus();

  document.execCommand("foreColor", false, normalizeColor(color));

  syncEditor(editor);
  schedulePreviewUpdate(editor);
}

function applySize(editor, size) {
  const surface = editor.querySelector(".sz-editor-surface");

  if (!surface) return;

  const normalizedSize = normalizeSize(size);

  surface.focus();

  document.execCommand("fontSize", false, "7");

  surface.querySelectorAll('font[size="7"]').forEach((font) => {
    const span = document.createElement("span");

    span.style.fontSize = `${normalizedSize}px`;

    while (font.firstChild) {
      span.appendChild(font.firstChild);
    }

    font.replaceWith(span);
  });

  syncEditor(editor);
  schedulePreviewUpdate(editor);
}

  function updatePreview(previewBox, editor) {
    if (!previewBox || !editor) return;

    syncEditor(editor);

    const source = editor.querySelector(".sz-editor-source");
    const contentBox = previewBox.querySelector(".sz-editor-preview-content");

    if (!source || !contentBox) return;

    contentBox.innerHTML = source.value.trim()
      ? renderBBCode(source.value)
      : "<p class=\"sz-editor-preview-empty\">Nada para visualizar ainda.</p>";

    previewBox.hidden = false;
    previewBox.removeAttribute("hidden");
  }

  function schedulePreviewUpdate(editor) {
    const previewBox = getPreviewForEditor(editor);

    if (!previewBox || previewBox.hidden) return;

    window.clearTimeout(previewTimers.get(editor));

    previewTimers.set(
      editor,
      window.setTimeout(() => {
        updatePreview(previewBox, editor);
      }, 300)
    );
  }

  function handleInsert(editor, type) {
    if (type === "quote") {
      insertHtml(editor, "<blockquote class=\"bb-quote\">Citação</blockquote>");
      return;
    }

    if (type === "spoiler") {
      insertHtml(editor, "<details class=\"bb-spoiler\"><summary>Spoiler</summary><div>Conteúdo escondido</div></details>");
      return;
    }

    if (type === "hr") {
      insertHtml(editor, "<hr class=\"bb-hr\">");
      return;
    }

    if (type === "link") {
      const url = window.prompt("Cole o link:");

      if (!url) return;

      if (!isSafeForumUrl(url)) {
        alert("Use um link com http://, https:// ou /uploads/.");
        return;
      }

      const label = window.prompt("Texto do link:", "link") || "link";

      insertHtml(editor, `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
      return;
    }

    if (type === "image-url") {
      const url = window.prompt("Cole a URL da imagem:");

      if (!url) return;

      if (!isSafeImageUrl(url)) {
        alert("Use uma imagem com http://, https:// ou /uploads/.");
        return;
      }

      insertHtml(
  editor,
  `<div style="text-align:center;"><img src="${url.trim()}" alt="Imagem enviada no fórum" class="bb-image"></div>`
);
      return;
    }

    if (type === "image-upload") {
      const fileInput = editor.querySelector(".sz-editor-file-input");

      if (fileInput) {
        fileInput.click();
      }

      return;
    }

    if (type === "youtube") {
      const url = window.prompt("Cole o link do YouTube:");

      if (!url) return;

      const id = extractYouTubeId(url);

      if (!id) {
        alert("Link do YouTube inválido.");
        return;
      }

      insertHtml(
        editor,
        `<div class="bb-youtube" data-youtube-id="${id}"><iframe src="https://www.youtube.com/embed/${id}" title="Vídeo do YouTube" loading="lazy" allowfullscreen></iframe></div>`
      );
      return;
    }

    if (type === "staff-note") {
      insertHtml(editor, "<div class=\"bb-box-note\"><b>Nota da Staff:</b><br>Escreva o comunicado oficial aqui.</div>");
      return;
    }

    if (type === "box-alert") {
      insertHtml(editor, "<div class=\"bb-box-alert\"><b>Atenção:</b><br>Escreva o alerta aqui.</div>");
      return;
    }

    if (type === "box-success") {
      insertHtml(editor, "<div class=\"bb-box-success\"><b>Resolvido:</b><br>Escreva a conclusão aqui.</div>");
      return;
    }

    if (type === "box-danger") {
      insertHtml(editor, "<div class=\"bb-box-danger\"><b>Punição / Irregularidade:</b><br>Escreva a informação aqui.</div>");
      return;
    }

    if (type === "glow") {
      const selectedText = escapeHtml(getSelectedText("texto com brilho"));
      insertHtml(editor, `<span class="bb-glow">${selectedText}</span>`);
      return;
    }

    if (type === "shadow") {
      const selectedText = escapeHtml(getSelectedText("texto com sombra"));
      insertHtml(editor, `<span class="bb-shadow">${selectedText}</span>`);
      return;
    }

    if (type === "big-title") {
      const selectedText = escapeHtml(getSelectedText("Título oficial"));
      insertHtml(editor, `<div class="bb-title">${selectedText}</div>`);
    }
  }

  async function readJsonResponse(response) {
    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  async function uploadImage(editor, file) {
    const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

    if (!file) return;

    if (!allowedTypes.has(file.type)) {
      alert("Envie apenas imagens png, jpg, jpeg, webp ou gif.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/uploads/forum-image", {
        method: "POST",
        body: formData
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Falha ao enviar imagem.");
      }

      insertHtml(
  editor,
  `<div style="text-align:center;"><img src="${data.url}" alt="Imagem enviada no fórum" class="bb-image"></div>`
);
    } catch (error) {
      alert(error.message || "Upload de imagem falhou.");
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-rich-editor]").forEach((editor) => {
      setEditorHtmlFromBBCode(editor);

      const surface = editor.querySelector(".sz-editor-surface");
      const source = editor.querySelector(".sz-editor-source");

      if (surface) {
        surface.addEventListener("input", function () {
          syncEditor(editor);
          schedulePreviewUpdate(editor);
        });
      }

      if (source && source.form) {
        source.form.addEventListener("submit", function (event) {
          if (source.form.dataset.editorSubmitting === "true") {
            event.preventDefault();
            return;
          }

          syncEditor(editor);

          if (!source.value.trim()) {
            event.preventDefault();
            alert("Escreva uma mensagem antes de enviar.");
            return;
          }

          source.form.dataset.editorSubmitting = "true";

          source.form.querySelectorAll("button[type='submit']").forEach((button) => {
            button.disabled = true;

            if (button.classList.contains("forum-submit-btn")) {
              button.dataset.originalText = button.textContent.trim();
              button.textContent = "Enviando...";
            }
          });
        });
      }
    });
  });

  window.addEventListener("pageshow", function () {
    document.querySelectorAll("form[data-editor-submitting='true']").forEach((form) => {
      form.dataset.editorSubmitting = "false";

      form.querySelectorAll("button[type='submit']").forEach((button) => {
        button.disabled = false;

        if (button.dataset.originalText) {
          button.textContent = button.dataset.originalText;
          delete button.dataset.originalText;
        }
      });
    });
  });

  document.addEventListener("click", function (event) {
    const moreToggle = event.target.closest("[data-editor-more-toggle]");

    if (moreToggle) {
      event.preventDefault();

      const editor = moreToggle.closest("[data-rich-editor]");

      if (editor) {
        const isOpen = editor.classList.toggle("is-more-open");
        moreToggle.setAttribute("aria-expanded", String(isOpen));
        moreToggle.textContent = isOpen ? "Menos" : "Mais";
      }

      return;
    }

    const commandButton = event.target.closest("[data-editor-command]");

    if (commandButton) {
      event.preventDefault();

      const editor = commandButton.closest("[data-rich-editor]");

      if (editor) {
        execEditorCommand(editor, commandButton.dataset.editorCommand);
      }

      return;
    }

    const insertButton = event.target.closest("[data-editor-insert]");

    if (insertButton) {
      event.preventDefault();

      const editor = insertButton.closest("[data-rich-editor]");

      if (editor) {
        handleInsert(editor, insertButton.dataset.editorInsert);
      }

      return;
    }

    const colorTrigger = event.target.closest("[data-color-trigger]");

    if (colorTrigger) {
      event.preventDefault();

      const picker = colorTrigger.closest(".sz-editor-color-picker");
      const menu = picker ? picker.querySelector(".sz-editor-color-menu") : null;

      if (menu) {
        menu.hidden = !menu.hidden;
      }

      return;
    }

    const colorButton = event.target.closest("[data-editor-color]");

    if (colorButton) {
      event.preventDefault();

      const editor = colorButton.closest("[data-rich-editor]");
      const menu = colorButton.closest(".sz-editor-color-menu");

      if (editor) {
        applyColor(editor, colorButton.dataset.editorColor);
      }

      if (menu) {
        menu.hidden = true;
      }

      return;
    }

    const previewButton = event.target.closest(".sz-editor-preview-btn");

    if (previewButton) {
      event.preventDefault();

      const editor = getEditorByTextareaId(previewButton.dataset.editorFor);
      const previewBox = previewButton.dataset.previewTarget
        ? document.getElementById(previewButton.dataset.previewTarget)
        : null;

      if (editor && previewBox) {
        updatePreview(previewBox, editor);
      }

      return;
    }

    const hidePreviewButton = event.target.closest("[data-preview-hide]");

    if (hidePreviewButton) {
      event.preventDefault();

      const previewBox = hidePreviewButton.closest(".sz-editor-preview");

      if (previewBox) {
        previewBox.hidden = true;
      }
    }
  });

  document.addEventListener("change", function (event) {
    const fileInput = event.target.closest(".sz-editor-file-input");

    if (fileInput) {
      const editor = fileInput.closest("[data-rich-editor]");
      const file = fileInput.files && fileInput.files[0];

      if (editor && file) {
        uploadImage(editor, file);
      }

      fileInput.value = "";
      return;
    }

    const sizeSelect = event.target.closest("[data-editor-size]");

    if (sizeSelect) {
      const editor = sizeSelect.closest("[data-rich-editor]");

      if (editor && sizeSelect.value) {
        applySize(editor, sizeSelect.value);
      }

      sizeSelect.value = "";
    }
  });
})();
