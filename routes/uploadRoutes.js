const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

const { requirePlayer } = require("../middlewares/playerAuthMiddleware");

const router = express.Router();

let multer = null;

try {
  multer = require("multer");
} catch (error) {
  multer = null;
}

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif"
]);

const forumUploadDir = path.join(__dirname, "..", "public", "uploads", "forum");
const profileUploadDir = path.join(__dirname, "..", "public", "uploads", "profile");

const profileUploadTypes = {
  avatar: {
    maxSize: 3 * 1024 * 1024,
    maxSizeLabel: "3MB"
  },
  banner: {
    maxSize: 5 * 1024 * 1024,
    maxSizeLabel: "5MB"
  },
  signature: {
    maxSize: 5 * 1024 * 1024,
    maxSizeLabel: "5MB"
  }
};

const getSafeExtension = (filename) => {
  const extension = path.extname(String(filename || "")).toLowerCase();
  return allowedExtensions.has(extension) ? extension : null;
};

const hasValidImageSignature = (filePath, extension) => {
  const buffer = fs.readFileSync(filePath);

  if (extension === ".png") {
    return buffer.length >= 8
      && buffer[0] === 0x89
      && buffer[1] === 0x50
      && buffer[2] === 0x4e
      && buffer[3] === 0x47
      && buffer[4] === 0x0d
      && buffer[5] === 0x0a
      && buffer[6] === 0x1a
      && buffer[7] === 0x0a;
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (extension === ".gif") {
    return buffer.length >= 6 && (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a");
  }

  if (extension === ".webp") {
    return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }

  return false;
};

const registerUnavailableRoute = (routePath) => {
  router.post(routePath, requirePlayer, (req, res) => {
    res.status(503).json({
      error: "Upload indisponivel. Instale a dependencia multer."
    });
  });
};

const createImageUpload = (uploadDir, maxSize) => {
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, uploadDir);
    },
    filename(req, file, callback) {
      const extension = getSafeExtension(file.originalname) || ".bin";
      const random = crypto.randomBytes(8).toString("hex");

      callback(null, `${Date.now()}-${random}${extension}`);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: maxSize
    },
    fileFilter(req, file, callback) {
      const extension = getSafeExtension(file.originalname);

      if (!extension || !allowedMimeTypes.has(file.mimetype)) {
        return callback(new Error("Formato de imagem invalido."));
      }

      return callback(null, true);
    }
  });
};

const handleImageUpload = (upload, publicDir, maxSizeLabel) => {
  return (req, res) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        const isSizeError = error.code === "LIMIT_FILE_SIZE";

        return res.status(400).json({
          error: isSizeError ? `A imagem deve ter no maximo ${maxSizeLabel}.` : "Envie apenas imagens png, jpg, jpeg, webp ou gif."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Nenhuma imagem enviada."
        });
      }

      const extension = getSafeExtension(req.file.filename);

      if (!extension || !hasValidImageSignature(req.file.path, extension)) {
        fs.rmSync(req.file.path, { force: true });

        return res.status(400).json({
          error: "Envie apenas imagens png, jpg, jpeg, webp ou gif."
        });
      }

      return res.json({
        url: `${publicDir}/${req.file.filename}`
      });
    });
  };
};

if (!multer) {
  registerUnavailableRoute("/forum-image");

  Object.keys(profileUploadTypes).forEach((type) => {
    registerUnavailableRoute(`/profile/${type}`);
  });
} else {
  fs.mkdirSync(forumUploadDir, { recursive: true });
  fs.mkdirSync(profileUploadDir, { recursive: true });

  const forumUpload = createImageUpload(forumUploadDir, 5 * 1024 * 1024);

  router.post("/forum-image", requirePlayer, handleImageUpload(forumUpload, "/uploads/forum", "5MB"));

  Object.entries(profileUploadTypes).forEach(([type, settings]) => {
    const upload = createImageUpload(profileUploadDir, settings.maxSize);

    router.post(
      `/profile/${type}`,
      requirePlayer,
      handleImageUpload(upload, "/uploads/profile", settings.maxSizeLabel)
    );
  });
}

module.exports = router;
