const prisma = require("../config/prisma");

const email = process.argv[2];
const medalSlug = process.argv[3];
const reason = process.argv.slice(4).join(" ") || null;

async function main() {
  if (!email || !medalSlug) {
    console.log("Uso correto:");
    console.log('node scripts/giveMedal.js email@exemplo.com fundador "Motivo opcional"');
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    }
  });

  if (!user) {
    console.log("❌ Usuário não encontrado.");
    return;
  }

  const medal = await prisma.medal.findUnique({
    where: {
      slug: medalSlug.trim().toLowerCase()
    }
  });

  if (!medal) {
    console.log("❌ Medalha não encontrada.");
    return;
  }

  await prisma.userMedal.upsert({
    where: {
      userId_medalId: {
        userId: user.id,
        medalId: medal.id
      }
    },
    update: {
      reason
    },
    create: {
      userId: user.id,
      medalId: medal.id,
      reason
    }
  });

  console.log(`✅ Medalha "${medal.name}" entregue para ${user.name}.`);
}

main()
  .catch((error) => {
    console.log("❌ Erro ao entregar medalha:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });