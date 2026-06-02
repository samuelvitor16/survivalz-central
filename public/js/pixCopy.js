document.addEventListener("DOMContentLoaded", () => {
  const copyButton = document.getElementById("copyPixButton");
  const pixPayload = document.getElementById("pixPayload");

  if (!copyButton || !pixPayload) return;

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pixPayload.value.trim());

      copyButton.textContent = "Pix copiado!";
      copyButton.classList.add("copied");

      setTimeout(() => {
        copyButton.textContent = "Copiar Pix";
        copyButton.classList.remove("copied");
      }, 2000);
    } catch (error) {
      pixPayload.select();
      document.execCommand("copy");
      alert("Pix copiado.");
    }
  });
});