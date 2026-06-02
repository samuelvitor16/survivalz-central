document.addEventListener("DOMContentLoaded", () => {
  const copyButton = document.getElementById("copyOrderButton");
  const copyText = document.getElementById("orderCopyText");

  if (!copyButton || !copyText) return;

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
});