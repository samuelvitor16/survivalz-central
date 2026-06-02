document.addEventListener("DOMContentLoaded", () => {
  const copyButton = document.getElementById("copyOrderButton");
  const copyText = document.getElementById("orderCopyText");

  if (copyButton && copyText) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyText.value.trim());

        copyButton.textContent = "Resumo copiado!";
        copyButton.classList.add("copied");

        setTimeout(() => {
          copyButton.textContent = "Copiar resumo";
          copyButton.classList.remove("copied");
        }, 2000);
      } catch (error) {
        copyText.style.display = "block";
        copyText.select();
        document.execCommand("copy");
        copyText.style.display = "none";

        alert("Resumo copiado.");
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