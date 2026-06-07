const QRCode = require("qrcode");

const removeAccents = (text) => {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const onlyAllowedTxid = (text) => {
  return String(text || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 25);
};

const limitText = (text, max) => {
  return removeAccents(text)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .substring(0, max);
};

const formatTLV = (id, value) => {
  const stringValue = String(value);
  const length = String(stringValue.length).padStart(2, "0");

  return `${id}${length}${stringValue}`;
};

const getCRC16 = (payload) => {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
};

const generatePixPayload = ({ pixKey, merchantName, merchantCity, amountCents, txid }) => {
  const amount = (Number(amountCents) / 100).toFixed(2);

  const name = limitText(merchantName, 25);
  const city = limitText(merchantCity, 15);
  const cleanTxid = onlyAllowedTxid(txid);

  const merchantAccountInfo =
    formatTLV("00", "br.gov.bcb.pix") +
    formatTLV("01", pixKey);

  const additionalDataField =
    formatTLV("05", cleanTxid);

  const payloadWithoutCRC =
    formatTLV("00", "01") +
    formatTLV("01", "11") +
    formatTLV("26", merchantAccountInfo) +
    formatTLV("52", "0000") +
    formatTLV("53", "986") +
    formatTLV("54", amount) +
    formatTLV("58", "BR") +
    formatTLV("59", name) +
    formatTLV("60", city) +
    formatTLV("62", additionalDataField) +
    "6304";

  const crc = getCRC16(payloadWithoutCRC);

  return `${payloadWithoutCRC}${crc}`;
};

const generatePixPayment = async ({ code, totalCents }) => {
  const pixKey = String(process.env.PIX_KEY || "").trim();
  const merchantName = process.env.PIX_MERCHANT_NAME || "SURVIVALZ";
  const merchantCity = process.env.PIX_MERCHANT_CITY || "SAO PAULO";

  if (!pixKey) {
    return {
      pixConfigured: false,
      pixCopyPaste: "",
      pixQrCode: "",
      payload: "",
      qrCodeImage: "",
      pixError: "PIX_KEY nao configurada no ambiente."
    };
  }

  const payload = generatePixPayload({
    pixKey,
    merchantName,
    merchantCity,
    amountCents: totalCents,
    txid: code
  });

  let qrCodeImage = "";
  let pixError = null;

  try {
    qrCodeImage = await QRCode.toDataURL(payload, {
      margin: 1,
      width: 260
    });
  } catch (error) {
    console.log("Erro ao gerar QR Code Pix:", error);
    pixError = "QR Code Pix indisponivel. Use o Pix Copia e Cola.";
  }

  return {
    pixConfigured: true,
    pixCopyPaste: payload,
    pixQrCode: qrCodeImage,
    payload,
    qrCodeImage,
    pixError
  };
};

const getStoredPixInfo = (order = {}) => {
  const payment = order.payment || {};
  const pixCopyPaste = order.pixCopyPaste || payment.pixCopyPaste || payment.payload || "";
  const pixQrCode = order.pixQrCode || order.qrCodeImage || payment.pixQrCode || payment.qrCodeImage || "";
  const pixError = order.pixError || payment.pixError || null;
  const hasExplicitConfig = typeof order.pixConfigured === "boolean" || typeof payment.pixConfigured === "boolean";
  const pixConfigured = hasExplicitConfig
    ? order.pixConfigured !== false && payment.pixConfigured !== false
    : Boolean(pixCopyPaste);

  return {
    pixConfigured,
    pixCopyPaste,
    pixQrCode,
    pixError,
    hasPixData: Boolean(pixCopyPaste || pixQrCode)
  };
};

const getPixInfoForOrder = async (order) => {
  const storedPix = getStoredPixInfo(order);

  if (storedPix.hasPixData) {
    return storedPix;
  }

  const generatedPix = await generatePixPayment({
    code: order.code,
    totalCents: order.total
  });

  return {
    pixConfigured: generatedPix.pixConfigured,
    pixCopyPaste: generatedPix.pixCopyPaste,
    pixQrCode: generatedPix.pixQrCode,
    pixError: generatedPix.pixError || storedPix.pixError,
    hasPixData: Boolean(generatedPix.pixCopyPaste || generatedPix.pixQrCode)
  };
};

module.exports = {
  generatePixPayment,
  getPixInfoForOrder,
  getStoredPixInfo
};
