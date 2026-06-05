const prisma = require("../config/prisma");

const medals = [
  {
    name: "Fundador",
    slug: "fundador",
    description: "Membro fundador da comunidade SurvivalZ.",
    icon: "👑",
    color: "#ff2b2b",
    rarity: "SPECIAL"
  },
  {
    name: "Beta Tester",
    slug: "beta-tester",
    description: "Participou da fase Beta oficial do SurvivalZ.",
    icon: "☣️",
    color: "#35d06f",
    rarity: "RARE"
  },
  {
    name: "Staff",
    slug: "staff",
    description: "Membro da equipe SurvivalZ.",
    icon: "🛡️",
    color: "#4da3ff",
    rarity: "SPECIAL"
  },
  {
    name: "Sobrevivente Veterano",
    slug: "sobrevivente-veterano",
    description: "Jogador antigo e ativo na comunidade.",
    icon: "🔥",
    color: "#f5b942",
    rarity: "EPIC"
  },
  {
    name: "Campeão de Evento",
    slug: "campeao-evento",
    description: "Venceu um evento oficial do servidor.",
    icon: "🏆",
    color: "#ffd700",
    rarity: "LEGENDARY"
  },
  {
    name: "Ajudante da Comunidade",
    slug: "ajudante-comunidade",
    description: "Contribuiu ajudando outros jogadores no fórum ou servidor.",
    icon: "🤝",
    color: "#ffffff",
    rarity: "RARE"
  },
  {
    name: "VIP",
    slug: "vip",
    description: "Jogador com benefício VIP ativo ou histórico VIP.",
    icon: "💎",
    color: "#b86bff",
    rarity: "EPIC"
  },
  {
    name: "Top Postador",
    slug: "top-postador",
    description: "Destaque por participação ativa no fórum.",
    icon: "✍️",
    color: "#ff5555",
    rarity: "RARE"
  }
];

async function main() {
  for (const medal of medals) {
    await prisma.medal.upsert({
      where: {
        slug: medal.slug
      },
      update: medal,
      create: medal
    });
  }

  console.log("✅ Medalhas iniciais criadas/atualizadas com sucesso.");
}

main()
  .catch((error) => {
    console.log("❌ Erro ao criar medalhas:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });