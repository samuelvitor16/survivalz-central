const prisma = require("../config/prisma");

const email = process.argv[2];
const role = process.argv[3];

const allowedRoles = ["PLAYER", "STAFF", "ADMIN", "OWNER"];

async function main() {
  if (!email || !role) {
    console.log("Uso correto:");
    console.log("node scripts/setUserRole.js email@exemplo.com STAFF");
    return;
  }

  if (!allowedRoles.includes(role)) {
    console.log("Cargo inválido. Use: PLAYER, STAFF, ADMIN ou OWNER");
    return;
  }

  const user = await prisma.user.update({
    where: {
      email: email.trim().toLowerCase()
    },
    data: {
      role
    }
  });

  console.log(`✅ ${user.email} agora é ${user.role}`);
}

main()
  .catch((error) => {
    console.log("❌ Erro ao alterar cargo:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });