document.addEventListener("DOMContentLoaded", () => {
  const copyPixButton = document.getElementById("copyPixButton");
  const pixPayload = document.getElementById("pixPayload");

  const copyOrderCodeButton = document.getElementById("copyOrderCodeButton");
  const orderCodeText = document.getElementById("orderCodeText");

  const copyDiscordMessageButton = document.getElementById("copyDiscordMessageButton");
  const discordMessageText = document.getElementById("discordMessageText");

  async function copyText(text, button, originalText, successText) {
    try {
      await navigator.clipboard.writeText(text.trim());

      button.textContent = successText;
      button.classList.add("copied");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 2000);
    } catch (error) {
      alert("Não foi possível copiar automaticamente. Copie manualmente.");
    }
  }

  if (copyPixButton && pixPayload) {
    copyPixButton.addEventListener("click", () => {
      copyText(
        pixPayload.value,
        copyPixButton,
        "Copiar Pix",
        "Pix copiado!"
      );
    });
  }

  if (copyOrderCodeButton && orderCodeText) {
    copyOrderCodeButton.addEventListener("click", () => {
      copyText(
        orderCodeText.value,
        copyOrderCodeButton,
        "Copiar código",
        "Código copiado!"
      );
    });
  }

  if (copyDiscordMessageButton && discordMessageText) {
    copyDiscordMessageButton.addEventListener("click", () => {
      copyText(
        discordMessageText.value,
        copyDiscordMessageButton,
        "Copiar mensagem",
        "Mensagem copiada!"
      );
    });
  }
});