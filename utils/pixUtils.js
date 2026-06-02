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
  const pixKey = process.env.PIX_KEY;
  const merchantName = process.env.PIX_MERCHANT_NAME || "SURVIVALZ";
  const merchantCity = process.env.PIX_MERCHANT_CITY || "SAO PAULO";

  if (!pixKey) {
    return null;
  }

  const payload = generatePixPayload({
    pixKey,
    merchantName,
    merchantCity,
    amountCents: totalCents,
    txid: code
  });

  const qrCodeImage = await QRCode.toDataURL(payload, {
    margin: 1,
    width: 260
  });

  return {
    payload,
    qrCodeImage
  };
};

module.exports = {
  generatePixPayment
};