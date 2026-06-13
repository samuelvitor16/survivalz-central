const prisma = require("../config/prisma");

const products = [
  // Pacotes Beta atuais
  {
    code: "beta-sobrevivente",
    name: "Sobrevivente Beta",
    category: "beta",
    type: "Acesso Beta",
    priceZCoins: null,
    referencePriceCents: 1000,
    stock: 15,
    isActive: true,
    isFeatured: false,
    position: 10,
    description: "Acesso básico ao Beta Fechado do SurvivalZ.",
    benefits: [
      "Acesso ao Beta Fechado",
      "Tag @Beta-Tester no Discord",
      "Tag @Beta-Tester no servidor",
      "Canais exclusivos do Beta",
      "Pode reportar bugs e enviar sugestões",
      "Nome no mural de apoiadores"
    ]
  },
  {
    code: "beta-explorador",
    name: "Explorador Beta",
    category: "beta",
    type: "Acesso Beta",
    priceZCoins: null,
    referencePriceCents: 3000,
    stock: 10,
    isActive: true,
    isFeatured: true,
    position: 11,
    description: "Pacote intermediário para quem quer mais benefícios no Beta.",
    benefits: [
      "Tudo do Sobrevivente Beta",
      "Prioridade nas sessões de teste",
      "VIP por 15 dias no lançamento",
      "Pequeno bônus de ZCoins",
      "1 veículo comum para teste no Beta",
      "Acesso antecipado a spoilers"
    ]
  },
  {
    code: "fundador-survivalz",
    name: "Fundador SurvivalZ",
    category: "beta",
    type: "Acesso Beta",
    priceZCoins: null,
    referencePriceCents: 5000,
    stock: 5,
    isActive: true,
    isFeatured: false,
    position: 12,
    description: "Pacote especial para apoiadores iniciais do projeto.",
    benefits: [
      "Tudo dos pacotes anteriores",
      "Prioridade máxima no Beta",
      "VIP por 30 dias no lançamento",
      "1 veículo especial visual no lançamento",
      "Nome destacado no mural de fundadores",
      "Acesso a spoilers privados",
      "Participação em votações futuras"
    ]
  },

  // ZCoins - base LEAD
  { code: "zcoins-330", name: "Pacote de Entrada", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 330, referencePriceCents: 999, isFeatured: false, position: 100, description: "Pacote inicial para comprar itens simples na loja.", benefits: ["Recebe 330 ZCoins", "Preço: R$ 9,99", "Saldo permanece na conta do jogador"] },
  { code: "zcoins-680", name: "Pacote Básico", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 680, referencePriceCents: 1899, isFeatured: false, position: 101, description: "Pacote básico para iniciar na economia da loja.", benefits: ["Recebe 680 ZCoins", "Preço: R$ 18,99", "Saldo permanece na conta do jogador"] },
  { code: "zcoins-1380", name: "Pacote Popular", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 1380, referencePriceCents: 3799, isFeatured: true, position: 102, description: "Pacote popular com bônus progressivo.", benefits: ["Recebe 1.380 ZCoins", "Composição sugerida: 1.275 + 105 de bônus", "Mais popular"] },
  { code: "zcoins-2800", name: "Pacote Avançado", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 2800, referencePriceCents: 7399, isFeatured: true, position: 103, description: "Pacote avançado para compras maiores.", benefits: ["Recebe 2.800 ZCoins", "Composição sugerida: 2.575 + 225 de bônus", "Melhor escolha"] },
  { code: "zcoins-5075", name: "Pacote Premium", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 5075, referencePriceCents: 12799, isFeatured: true, position: 104, description: "Pacote premium com bônus maior.", benefits: ["Recebe 5.075 ZCoins", "Composição sugerida: 4.575 + 500 de bônus", "Melhor bônus"] },
  { code: "zcoins-7200", name: "Pacote Supremo", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 7200, referencePriceCents: 17799, isFeatured: false, position: 105, description: "Pacote supremo para jogadores que querem mais saldo.", benefits: ["Recebe 7.200 ZCoins", "Composição sugerida: 6.425 + 775 de bônus"] },
  { code: "zcoins-15025", name: "Pacote Elite", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 15025, referencePriceCents: 35799, isFeatured: false, position: 106, description: "Pacote elite com bônus elevado.", benefits: ["Recebe 15.025 ZCoins", "Composição sugerida: 12.850 + 2.175 de bônus"] },
  { code: "zcoins-38600", name: "Pacote Lendário", category: "zcoins", type: "Pacotes de ZCoins", priceZCoins: 38600, referencePriceCents: 88799, isFeatured: false, position: 107, description: "Maior pacote de ZCoins da estrutura inicial.", benefits: ["Recebe 38.600 ZCoins", "Composição sugerida: 32.150 + 6.450 de bônus"] },

  // VIPs
  { code: "vip-gold", name: "VIP Gold", category: "vip", type: "VIP 30 dias", priceZCoins: 600, referencePriceCents: 1499, position: 200, description: "Plano acessível de entrada para benefícios premium.", benefits: ["VIP Gold por 30 dias", "Preço: 600 ZCoins", "Valor estratégico: R$ 14,99"] },
  { code: "vip-platina", name: "VIP Platina", category: "vip", type: "VIP 30 dias", priceZCoins: 1200, referencePriceCents: 2999, isFeatured: true, position: 201, description: "Melhor custo-benefício entre os planos premium.", benefits: ["VIP Platina por 30 dias", "Preço: 1.200 ZCoins", "Valor estratégico: R$ 29,99", "Melhor custo-benefício"] },
  { code: "vip-safira", name: "VIP Safira", category: "vip", type: "VIP 30 dias", priceZCoins: 2400, referencePriceCents: 5999, position: 202, description: "Plano avançado para jogadores mais ativos.", benefits: ["VIP Safira por 30 dias", "Preço: 2.400 ZCoins", "Valor estratégico: R$ 59,99"] },
  { code: "vip-zombie", name: "VIP Zombie", category: "vip", type: "VIP 30 dias", priceZCoins: 4400, referencePriceCents: 10999, position: 203, description: "Plano máximo focado em exclusividade e comodidade.", benefits: ["VIP Zombie por 30 dias", "Preço: 4.400 ZCoins", "Valor estratégico: R$ 109,99"] },

  // Veículos terrestres comuns
  { code: "vehicle-bandito-568", name: "Bandito", category: "vehicles", type: "Veículos terrestres", modelId: 568, capacityKg: 20, priceZCoins: 1000, referencePriceCents: 2499, position: 300, description: "Veículo terrestre de entrada com alta mobilidade.", benefits: ["Modelo ID 568", "Capacidade: 20kg", "Preço: 1.000 ZCoins"] },
  { code: "vehicle-comet-480", name: "Comet", category: "vehicles", type: "Veículos terrestres", modelId: 480, capacityKg: 40, priceZCoins: 2400, referencePriceCents: 5999, position: 301, description: "Veículo esportivo com capacidade média.", benefits: ["Modelo ID 480", "Capacidade: 40kg", "Preço: 2.400 ZCoins"] },
  { code: "vehicle-fbi-rancher-490", name: "FBI Rancher", category: "vehicles", type: "Veículos terrestres", modelId: 490, capacityKg: 60, priceZCoins: 2800, referencePriceCents: 6999, position: 302, description: "Veículo robusto com capacidade superior.", benefits: ["Modelo ID 490", "Capacidade: 60kg", "Preço: 2.800 ZCoins"] },
  { code: "vehicle-monster-a-556", name: "Monster A", category: "vehicles", type: "Veículos terrestres", modelId: 556, capacityKg: 40, priceZCoins: 3200, referencePriceCents: 7999, isFeatured: true, position: 303, description: "Veículo especial de grande presença visual.", benefits: ["Modelo ID 556", "Capacidade: 40kg", "Veículo especial", "Preço: 3.200 ZCoins"] },
  { code: "vehicle-cheetah-415", name: "Cheetah", category: "vehicles", type: "Veículos terrestres", modelId: 415, capacityKg: 40, priceZCoins: 3400, referencePriceCents: 8499, position: 304, description: "Esportivo clássico com bom desempenho.", benefits: ["Modelo ID 415", "Capacidade: 40kg", "Preço: 3.400 ZCoins"] },
  { code: "vehicle-bullet-541", name: "Bullet", category: "vehicles", type: "Veículos terrestres", modelId: 541, capacityKg: 40, priceZCoins: 3600, referencePriceCents: 8999, position: 305, description: "Veículo esportivo premium.", benefits: ["Modelo ID 541", "Capacidade: 40kg", "Preço: 3.600 ZCoins"] },
  { code: "vehicle-nrg-500-522", name: "NRG-500", category: "vehicles", type: "Veículos terrestres", modelId: 522, capacityKg: 20, priceZCoins: 4400, referencePriceCents: 10999, isFeatured: true, position: 306, description: "Moto de alta mobilidade para deslocamentos rápidos.", benefits: ["Modelo ID 522", "Capacidade: 20kg", "Alta mobilidade", "Preço: 4.400 ZCoins"] },
  { code: "vehicle-turismo-451", name: "Turismo", category: "vehicles", type: "Veículos terrestres", modelId: 451, capacityKg: 40, priceZCoins: 5600, referencePriceCents: 13999, position: 307, description: "Veículo esportivo de alto valor.", benefits: ["Modelo ID 451", "Capacidade: 40kg", "Preço: 5.600 ZCoins"] },
  { code: "vehicle-infernus-411", name: "Infernus", category: "vehicles", type: "Veículos terrestres", modelId: 411, capacityKg: 40, priceZCoins: 6400, referencePriceCents: 15999, position: 308, description: "Um dos veículos mais desejados da loja.", benefits: ["Modelo ID 411", "Capacidade: 40kg", "Preço: 6.400 ZCoins"] },

  // Blindados terrestres
  { code: "vehicle-enforcer-427", name: "Enforcer", category: "vehicles", type: "Veículos blindados", modelId: 427, capacityKg: 120, armorTier: "Blindagem Tier 2", priceZCoins: 6800, referencePriceCents: 16999, position: 330, description: "Veículo blindado com grande capacidade.", benefits: ["Modelo ID 427", "Capacidade: 120kg", "Blindagem Tier 2", "Preço: 6.800 ZCoins"] },
  { code: "vehicle-fbi-truck-528", name: "FBI Truck", category: "vehicles", type: "Veículos blindados", modelId: 528, capacityKg: 70, armorTier: "Blindagem Tier 3", priceZCoins: 7600, referencePriceCents: 18999, position: 331, description: "Blindado Tier 3 da coleção terrestre.", benefits: ["Modelo ID 528", "Capacidade: 70kg", "Blindagem Tier 3", "Preço: 7.600 ZCoins"] },
  { code: "vehicle-swat-601", name: "SWAT", category: "vehicles", type: "Veículos blindados", modelId: 601, capacityKg: 70, armorTier: "Blindagem Tier 3", priceZCoins: 8800, referencePriceCents: 21999, position: 332, description: "Blindado terrestre de maior valor inicial.", benefits: ["Modelo ID 601", "Capacidade: 70kg", "Blindagem Tier 3", "Preço: 8.800 ZCoins"] },

  // Caminhões
  { code: "truck-boxville-498", name: "Boxville", category: "vehicles", type: "Caminhões", modelId: 498, capacityKg: 300, priceZCoins: 2400, referencePriceCents: 5999, position: 360, description: "Caminhão de entrada com boa capacidade.", benefits: ["Modelo ID 498", "Capacidade: 300kg", "Preço: 2.400 ZCoins"] },
  { code: "truck-firetruck-407", name: "Firetruck", category: "vehicles", type: "Caminhões", modelId: 407, capacityKg: 400, priceZCoins: 3200, referencePriceCents: 7999, position: 361, description: "Caminhão com capacidade intermediária.", benefits: ["Modelo ID 407", "Capacidade: 400kg", "Preço: 3.200 ZCoins"] },
  { code: "truck-barracks-433", name: "Barracks", category: "vehicles", type: "Caminhões", modelId: 433, capacityKg: 600, priceZCoins: 4400, referencePriceCents: 10999, position: 362, description: "Caminhão militar com alta capacidade.", benefits: ["Modelo ID 433", "Capacidade: 600kg", "Preço: 4.400 ZCoins"] },
  { code: "truck-mr-whoopee-423", name: "Mr. Whoopee", category: "vehicles", type: "Caminhões", modelId: 423, capacityKg: 700, priceZCoins: 5200, referencePriceCents: 12999, position: 363, description: "Caminhão especial com capacidade elevada.", benefits: ["Modelo ID 423", "Capacidade: 700kg", "Preço: 5.200 ZCoins"] },
  { code: "truck-dune-573", name: "Dune", category: "vehicles", type: "Caminhões", modelId: 573, capacityKg: 900, priceZCoins: 6400, referencePriceCents: 15999, position: 364, description: "Caminhão de maior capacidade da estrutura inicial.", benefits: ["Modelo ID 573", "Capacidade: 900kg", "Preço: 6.400 ZCoins"] },

  // Helicópteros
  { code: "heli-sparrow-469", name: "Sparrow", category: "vehicles", type: "Helicópteros", modelId: 469, capacityKg: 60, priceZCoins: 2500, referencePriceCents: 6299, position: 390, description: "Helicóptero de entrada.", benefits: ["Modelo ID 469", "Capacidade: 60kg", "Helicóptero de entrada", "Preço: 2.500 ZCoins"] },
  { code: "heli-maverick-487", name: "Maverick", category: "vehicles", type: "Helicópteros", modelId: 487, capacityKg: 70, priceZCoins: 4800, referencePriceCents: 11999, position: 391, description: "Helicóptero clássico da loja.", benefits: ["Modelo ID 487", "Capacidade: 70kg", "Preço: 4.800 ZCoins"] },
  { code: "heli-police-maverick-497", name: "Police Maverick", category: "vehicles", type: "Helicópteros", modelId: 497, capacityKg: 70, collection: "Coleção Polícia", priceZCoins: 5600, referencePriceCents: 13999, position: 392, description: "Helicóptero da coleção policial.", benefits: ["Modelo ID 497", "Capacidade: 70kg", "Coleção policial", "Preço: 5.600 ZCoins"] },
  { code: "heli-raindance-563", name: "Raindance", category: "vehicles", type: "Helicópteros", modelId: 563, capacityKg: 400, armorTier: "Blindagem Tier 4", priceZCoins: 6800, referencePriceCents: 16999, position: 393, description: "Helicóptero blindado com grande capacidade.", benefits: ["Modelo ID 563", "Capacidade: 400kg", "Blindagem Tier 4", "Preço: 6.800 ZCoins"] },
  { code: "heli-leviathan-417", name: "Leviathan", category: "vehicles", type: "Helicópteros", modelId: 417, capacityKg: 500, armorTier: "Blindagem Tier 4", priceZCoins: 7600, referencePriceCents: 18999, position: 394, description: "Helicóptero blindado de alta capacidade.", benefits: ["Modelo ID 417", "Capacidade: 500kg", "Blindagem Tier 4", "Preço: 7.600 ZCoins"] },
  { code: "heli-cargobob-548", name: "Cargobob", category: "vehicles", type: "Helicópteros", modelId: 548, capacityKg: 600, armorTier: "Blindagem Tier 5", priceZCoins: 8800, referencePriceCents: 21999, position: 395, description: "Helicóptero de maior capacidade e blindagem inicial.", benefits: ["Modelo ID 548", "Capacidade: 600kg", "Blindagem Tier 5", "Preço: 8.800 ZCoins"] },

  // Aviões
  { code: "plane-dodo-593", name: "Dodo", category: "vehicles", type: "Aviões", modelId: 593, priceZCoins: 2800, referencePriceCents: 6999, position: 420, description: "Avião de entrada da loja.", benefits: ["Modelo ID 593", "Preço: 2.800 ZCoins"] },
  { code: "plane-stunt-513", name: "Stuntplane", category: "vehicles", type: "Aviões", modelId: 513, priceZCoins: 4000, referencePriceCents: 9999, position: 421, description: "Avião acrobático.", benefits: ["Modelo ID 513", "Preço: 4.000 ZCoins"] },
  { code: "plane-rustler-476", name: "Rustler", category: "vehicles", type: "Aviões", modelId: 476, priceZCoins: 6000, referencePriceCents: 14999, position: 422, description: "Avião comercial entregue sem armamento ofensivo funcional.", benefits: ["Modelo ID 476", "Sem armamento ofensivo funcional", "Preço: 6.000 ZCoins"] },

  // Coleção Ilha
  { code: "boat-dinghy-473", name: "Dinghy", category: "vehicles", type: "Coleção Ilha", modelId: 473, collection: "Coleção Ilha", priceZCoins: 800, referencePriceCents: 1999, position: 450, description: "Barco de entrada da Coleção Ilha.", benefits: ["Modelo ID 473", "Barco de entrada", "Preço: 800 ZCoins"] },
  { code: "boat-speeder-452", name: "Speeder", category: "vehicles", type: "Coleção Ilha", modelId: 452, collection: "Coleção Ilha", priceZCoins: 1600, referencePriceCents: 3999, position: 451, description: "Lancha rápida da Coleção Ilha.", benefits: ["Modelo ID 452", "Lancha rápida", "Preço: 1.600 ZCoins"] },
  { code: "boat-jetmax-493", name: "Jetmax", category: "vehicles", type: "Coleção Ilha", modelId: 493, collection: "Coleção Ilha", priceZCoins: 2200, referencePriceCents: 5499, position: 452, description: "Lancha esportiva premium.", benefits: ["Modelo ID 493", "Lancha esportiva", "Preço: 2.200 ZCoins"] },
  { code: "boat-predator-430", name: "Predator", category: "vehicles", type: "Coleção Ilha", modelId: 430, collection: "Coleção Polícia", priceZCoins: 3000, referencePriceCents: 7499, position: 453, description: "Barco da coleção policial sem recurso ofensivo funcional.", benefits: ["Modelo ID 430", "Coleção policial", "Sem recurso ofensivo funcional", "Preço: 3.000 ZCoins"] },
  { code: "plane-skimmer-460", name: "Skimmer", category: "vehicles", type: "Coleção Ilha", modelId: 460, collection: "Coleção Ilha", priceZCoins: 3200, referencePriceCents: 7999, position: 454, description: "Avião aquático da Coleção Ilha.", benefits: ["Modelo ID 460", "Avião aquático", "Preço: 3.200 ZCoins"] },
  { code: "boat-tropic-454", name: "Tropic", category: "vehicles", type: "Coleção Ilha", modelId: 454, collection: "Coleção Ilha", priceZCoins: 4000, referencePriceCents: 9999, position: 455, description: "Barco premium da Coleção Ilha.", benefits: ["Modelo ID 454", "Barco premium", "Preço: 4.000 ZCoins"] },
  { code: "boat-marquis-484", name: "Marquis", category: "vehicles", type: "Coleção Ilha", modelId: 484, capacityKg: 200, collection: "Coleção Ilha", priceZCoins: 6000, referencePriceCents: 14999, position: 456, description: "Maior capacidade da Coleção Ilha.", benefits: ["Modelo ID 484", "Capacidade: 200kg", "Preço: 6.000 ZCoins"] },

  // Outros produtos-base
  { code: "skin-comum", name: "Skin Comum", category: "skins", type: "Skins", priceZCoins: 680, referencePriceCents: 1699, position: 500, description: "Faixa base para skins comuns.", benefits: ["Preço-base: 680 ZCoins", "Valor estratégico: R$ 16,99"] },
  { code: "skin-rara", name: "Skin Rara", category: "skins", type: "Skins", priceZCoins: 1380, referencePriceCents: 3499, position: 501, description: "Faixa base para skins raras.", benefits: ["Preço-base: 1.380 ZCoins", "Valor estratégico: R$ 34,99"] },
  { code: "skin-exclusiva", name: "Skin Exclusiva", category: "skins", type: "Skins", priceZCoins: 2800, referencePriceCents: 6999, position: 502, description: "Faixa base para skins exclusivas.", benefits: ["Preço-base: 2.800 ZCoins", "Valor estratégico: R$ 69,99"] },
  { code: "passe-premium", name: "Passe Premium", category: "season_pass", type: "Passe de temporada", priceZCoins: 2000, referencePriceCents: 4999, position: 600, description: "Passe premium de temporada.", benefits: ["Preço: 2.000 ZCoins", "Valor estratégico: R$ 49,99"] },
  { code: "pacote-fundador", name: "Pacote Fundador", category: "special_packages", type: "Pacotes especiais", priceZCoins: 6400, referencePriceCents: 15999, position: 700, description: "Pacote fundador com elementos permanentes de prestígio.", benefits: ["Tag exclusiva", "Skin especial", "Acessório exclusivo", "Vaga adicional", "Evitar vantagens exageradas de combate"] },
  { code: "caixa-basica", name: "Caixa Básica", category: "crates", type: "Caixas", priceZCoins: 330, referencePriceCents: 799, position: 800, description: "Caixa básica focada em recompensas cosméticas.", benefits: ["Preço: 330 ZCoins", "Valor estratégico: R$ 7,99"] },
  { code: "caixa-intermediaria", name: "Caixa Intermediária", category: "crates", type: "Caixas", priceZCoins: 680, referencePriceCents: 1699, position: 801, description: "Caixa intermediária com recompensas cosméticas.", benefits: ["Preço: 680 ZCoins", "Valor estratégico: R$ 16,99"] },
  { code: "caixa-avancada", name: "Caixa Avançada", category: "crates", type: "Caixas", priceZCoins: 1380, referencePriceCents: 3499, position: 802, description: "Caixa avançada com foco em cosméticos e colecionáveis.", benefits: ["Preço: 1.380 ZCoins", "Valor estratégico: R$ 34,99"] }
];

const slugify = (text) => {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const main = async () => {
  let created = 0;
  let updated = 0;

  for (const product of products) {
    const slug = slugify(product.code || product.name);

    const existing = await prisma.storeProduct.findUnique({
      where: {
        code: product.code
      }
    });

    const data = {
      ...product,
      slug,
      imageUrl: product.imageUrl || null,
      armorTier: product.armorTier || null,
      collection: product.collection || null,
      modelId: product.modelId || null,
      capacityKg: product.capacityKg || null,
      stock: product.stock === undefined ? null : product.stock,
      isActive: product.isActive === undefined ? true : product.isActive,
      isFeatured: product.isFeatured === undefined ? false : product.isFeatured
    };

    if (existing) {
      await prisma.storeProduct.update({
        where: {
          code: product.code
        },
        data
      });
      updated += 1;
    } else {
      await prisma.storeProduct.create({ data });
      created += 1;
    }
  }

  console.log(`✅ Produtos importados. Criados: ${created}. Atualizados: ${updated}. Total: ${products.length}.`);
};

main()
  .catch((error) => {
    console.error("❌ Erro ao importar produtos da loja:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
