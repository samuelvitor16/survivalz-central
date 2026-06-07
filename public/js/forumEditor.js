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

  function renderBBCode(rawText) {
    let html = escapeHtml(rawText);

    html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
    html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
    html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
    html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");
    html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, "<div class=\"bb-center\">$1</div>");
    html = html.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, "<div class=\"bb-right\">$1</div>");
    html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class=\"bb-quote\">$1</blockquote>");
    html = html.replace(
      /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
      "<details class=\"bb-spoiler\"><summary>Spoiler</summary><div>$1</div></details>"
    );
    html = html.replace(/\[color=([^\]\s]+)\]([\s\S]*?)\[\/color\]/gi, function (_, color, content) {
      return `<span style="color:${normalizeColor(color)}">${content}</span>`;
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
        ? `<img src="${safeUrl}" alt="Imagem enviada no forum" class="bb-image" loading="lazy">`
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

  function nodeToBBCode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const content = getChildrenBBCode(node);

    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `[b]${content}[/b]`;
    if (tag === "em" || tag === "i") return `[i]${content}[/i]`;
    if (tag === "u") return `[u]${content}[/u]`;
    if (tag === "s" || tag === "strike" || tag === "del") return `[s]${content}[/s]`;
    if (tag === "blockquote") return `[quote]${content}[/quote]`;

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

    if (tag === "span") {
      const color = node.style.color;
      return color ? `[color=${rgbToHex(color)}]${content}[/color]` : content;
    }

    if (tag === "div" || tag === "p") {
      const align = getNodeAlign(node);

      if (align === "center") return `[center]${content}[/center]\n`;
      if (align === "right") return `[right]${content}[/right]\n`;

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

  function applyColor(editor, color) {
    const surface = editor.querySelector(".sz-editor-surface");

    if (!surface) return;

    surface.focus();
    document.execCommand("foreColor", false, normalizeColor(color));
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
      insertHtml(editor, "<blockquote class=\"bb-quote\">Citacao</blockquote>");
      return;
    }

    if (type === "spoiler") {
      insertHtml(editor, "<details class=\"bb-spoiler\"><summary>Spoiler</summary><div>Conteudo escondido</div></details>");
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

      insertHtml(editor, `<img src="${url.trim()}" alt="Imagem enviada no forum" class="bb-image">`);
      return;
    }

    if (type === "image-upload") {
      const fileInput = editor.querySelector(".sz-editor-file-input");

      if (fileInput) {
        fileInput.click();
      }
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
      alert("A imagem deve ter no maximo 5MB.");
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

      insertHtml(editor, `<img src="${data.url}" alt="Imagem enviada no forum" class="bb-image">`);
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
          syncEditor(editor);

          if (!source.value.trim()) {
            event.preventDefault();
            alert("Escreva uma mensagem antes de enviar.");
          }
        });
      }
    });
  });

  document.addEventListener("click", function (event) {
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

    if (!fileInput) return;

    const editor = fileInput.closest("[data-rich-editor]");
    const file = fileInput.files && fileInput.files[0];

    if (editor && file) {
      uploadImage(editor, file);
    }

    fileInput.value = "";
  });
})();
