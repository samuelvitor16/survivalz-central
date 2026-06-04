const prisma = require("../config/prisma");

const categories = [
  {
    name: "Avisos Oficiais",
    slug: "avisos-oficiais",
    description: "Comunicados importantes da gestão do SurvivalZ.",
    icon: "📢",
    color: "#ff2b2b",
    position: 1
  },
  {
    name: "Dúvidas",
    slug: "duvidas",
    description: "Área para tirar dúvidas sobre servidor, loja, regras e sistemas.",
    icon: "❓",
    color: "#f5b942",
    position: 2
  },
  {
    name: "Sugestões",
    slug: "sugestoes",
    description: "Envie ideias para melhorar o SurvivalZ.",
    icon: "💡",
    color: "#35d06f",
    position: 3
  },
  {
    name: "Denúncias",
    slug: "denuncias",
    description: "Área para denúncias contra jogadores, abusos ou problemas.",
    icon: "⚠️",
    color: "#ff5555",
    position: 4
  },
  {
    name: "Revisão de Punição",
    slug: "revisao-punicao",
    description: "Solicite revisão de banimentos, punições ou decisões da staff.",
    icon: "⚖️",
    color: "#b86bff",
    position: 5
  },
  {
    name: "Guias e Tutoriais",
    slug: "guias-tutoriais",
    description: "Conteúdos úteis para novos sobreviventes.",
    icon: "📖",
    color: "#4da3ff",
    position: 6
  },
  {
    name: "Comunidade",
    slug: "comunidade",
    description: "Conversas gerais, prints, histórias e interação entre players.",
    icon: "💬",
    color: "#ffffff",
    position: 7
  }
];

async function main() {
  for (const category of categories) {
    await prisma.forumCategory.upsert({
      where: {
        slug: category.slug
      },
      update: category,
      create: category
    });
  }

  console.log("✅ Categorias do fórum criadas/atualizadas com sucesso.");
}

main()
  .catch((error) => {
    console.log("❌ Erro ao criar categorias:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });