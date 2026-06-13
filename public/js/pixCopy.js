document.addEventListener("DOMContentLoaded", () => {
  const copyPixButton = document.getElementById("copyPixButton");
  const pixPayload = document.getElementById("pixPayload");
  const copyOrderCodeButton = document.getElementById("copyOrderCodeButton");
  const orderCodeText = document.getElementById("orderCodeText");
  const copyDiscordMessageButton = document.getElementById("copyDiscordMessageButton");
  const discordMessageText = document.getElementById("discordMessageText");

  async function copyToClipboard(text) {
    const value = String(text || "").trim();
    if (!value) return false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        // Fall through to the temporary textarea fallback.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  async function handleCopy(source, button, originalText, successText) {
    if (!source || !button) return;

    const copied = await copyToClipboard(source.value || source.textContent);
    if (copied) {
      button.textContent = successText;
      button.classList.add("copied");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 2200);
      return;
    }

    source.hidden = false;
    source.style.display = "block";
    source.style.position = "static";
    source.style.left = "auto";
    source.style.top = "auto";
    source.style.width = "100%";
    source.style.height = "160px";
    source.style.opacity = "1";
    source.focus();
    source.select();
    button.textContent = "Copie manualmente";
    alert("Nao foi possivel copiar. Selecione e copie manualmente.");
  }

  if (copyPixButton && pixPayload) {
    copyPixButton.addEventListener("click", () => {
      handleCopy(pixPayload, copyPixButton, "Copiar Pix", "Pix copiado!");
    });
  }

  if (copyOrderCodeButton && orderCodeText) {
    copyOrderCodeButton.addEventListener("click", () => {
      handleCopy(orderCodeText, copyOrderCodeButton, "Copiar codigo", "Codigo copiado!");
    });
  }

  if (copyDiscordMessageButton && discordMessageText) {
    copyDiscordMessageButton.addEventListener("click", () => {
      handleCopy(discordMessageText, copyDiscordMessageButton, "Copiar mensagem", "Mensagem copiada!");
    });
  }
});
