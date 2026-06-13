document.addEventListener("DOMContentLoaded", () => {
  const copyButton = document.getElementById("copyOrderButton");
  const copyText = document.getElementById("orderCopyText");

  async function copyToClipboard(text) {
    const value = String(text || "").trim();
    if (!value) return false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        // Fallback below.
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

  if (copyButton && copyText) {
    copyButton.addEventListener("click", async () => {
      const copied = await copyToClipboard(copyText.value);
      if (copied) {
        copyButton.textContent = "Resumo copiado!";
        copyButton.classList.add("copied");

        setTimeout(() => {
          copyButton.textContent = "Copiar resumo";
          copyButton.classList.remove("copied");
        }, 2000);
      } else {
        copyText.style.display = "block";
        copyText.style.position = "static";
        copyText.style.left = "auto";
        copyText.style.top = "auto";
        copyText.style.width = "100%";
        copyText.style.height = "180px";
        copyText.style.opacity = "1";
        copyText.focus();
        copyText.select();
        copyButton.textContent = "Copie manualmente";
        alert("Nao foi possivel copiar. Selecione e copie manualmente.");
      }
    });
  }

  const statusForms = document.querySelectorAll(".admin-status-form");

  statusForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      const message = form.dataset.confirm || "Confirmar alteração do pedido?";

      const confirmed = confirm(message);

      if (!confirmed) {
        event.preventDefault();
      }
    });
  });
});
