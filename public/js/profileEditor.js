(function () {
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);
  const profileUploadUrlPattern = /^\/uploads\/profile\/[0-9]+-[a-f0-9]+\.(png|jpg|jpeg|webp|gif)$/i;

  const getById = (id) => document.getElementById(id);

  const isPreviewableUrl = (value) => {
    const trimmed = String(value || "").trim();

    return /^https?:\/\//i.test(trimmed) || profileUploadUrlPattern.test(trimmed);
  };

  const showMessage = (message, type) => {
    const box = document.querySelector("[data-profile-upload-message]");

    if (!box) return;

    box.textContent = message;
    box.dataset.state = type;
    box.hidden = false;
  };

  const readJsonResponse = async (response) => {
    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  };

  const toIdList = (value) => {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const setFallbacks = (fallbackIds, isVisible) => {
    fallbackIds.forEach((id) => {
      const fallback = getById(id);

      if (fallback) {
        fallback.style.display = isVisible ? "flex" : "none";
      }
    });
  };

  const withCacheBuster = (url) => {
    const value = String(url || "").trim();

    if (!value || !value.startsWith("/uploads/")) {
      return value;
    }

    return `${value}${value.includes("?") ? "&" : "?"}v=${Date.now()}`;
  };

  const updateImagePreviews = (previewIds, fallbackIds, value) => {
    const trimmed = String(value || "").trim();
    const canPreview = isPreviewableUrl(trimmed);
    const previewUrl = canPreview ? withCacheBuster(trimmed) : "";

    previewIds.forEach((id) => {
      const image = getById(id);

      if (!image) return;

      image.src = previewUrl;
      image.style.display = canPreview ? "block" : "none";
    });

    setFallbacks(fallbackIds, !canPreview);
  };

  const bindUrlPreview = (inputId, previewIds, fallbackIds) => {
    const input = getById(inputId);

    if (!input) return;

    input.addEventListener("input", () => {
      updateImagePreviews(previewIds, fallbackIds, input.value);
    });
  };

  const syncSignatureText = () => {
    const input = getById("signatureText");
    const previews = [getById("signatureTextCardPreview"), getById("signatureTextPreview")].filter(Boolean);

    if (!input || previews.length === 0) return;

    input.addEventListener("input", () => {
      previews.forEach((preview) => {
        preview.textContent = input.value || "Texto da assinatura.";
      });
    });
  };

  const uploadImage = async (fileInput) => {
    const file = fileInput.files && fileInput.files[0];
    const endpoint = fileInput.dataset.profileEndpoint;
    const targetInput = getById(fileInput.dataset.profileInput);
    const previewIds = toIdList(fileInput.dataset.profilePreview);
    const fallbackIds = toIdList(fileInput.dataset.profileFallback);
    const maxSize = Number(fileInput.dataset.profileMaxSize || 0);

    if (!file || !endpoint || !targetInput) return;

    if (!allowedTypes.has(file.type)) {
      showMessage("Envie apenas imagens png, jpg, jpeg, webp ou gif.", "error");
      fileInput.value = "";
      return;
    }

    if (maxSize && file.size > maxSize) {
      const maxSizeMb = Math.round(maxSize / 1024 / 1024);
      showMessage(`A imagem deve ter no maximo ${maxSizeMb}MB.`, "error");
      fileInput.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    fileInput.disabled = true;
    showMessage("Enviando imagem...", "loading");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Falha ao enviar imagem.");
      }

      targetInput.value = data.url;
      updateImagePreviews(previewIds, fallbackIds, data.url);
      showMessage("Imagem enviada com sucesso. Salve o perfil para confirmar.", "success");
    } catch (error) {
      showMessage(error.message || "Upload de imagem falhou.", "error");
    } finally {
      fileInput.disabled = false;
      fileInput.value = "";
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindUrlPreview("avatarUrl", ["avatarCardPreview", "avatarPreview"], ["avatarCardFallback", "avatarFallback"]);
    bindUrlPreview("bannerUrl", ["bannerCardPreview", "bannerPreviewImage"], []);
    bindUrlPreview("signatureImageUrl", ["signatureImageCardPreview", "signatureImagePreview"], []);
    syncSignatureText();

    document.querySelectorAll("[data-profile-upload]").forEach((fileInput) => {
      fileInput.addEventListener("change", () => uploadImage(fileInput));
    });
  });
})();
