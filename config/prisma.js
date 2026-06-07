require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const toNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "127.0.0.1",
  port: toNumber(process.env.DB_PORT, 3306),
  user: process.env.DB_USER || "survivalz",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "survivalz_central",
  connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 5),
  allowPublicKeyRetrieval: true
});

const prisma = new PrismaClient({
  adapter
});

module.exports = prisma;
