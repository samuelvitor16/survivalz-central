// ==================================================
// ☣️ CATÁLOGO OFICIAL — LOJA BETA SURVIVALZ
// ==================================================
//
// Regras atuais:
// - Pacotes de acesso Beta NÃO entram na promoção de metade do preço.
// - VIPs usam os valores promocionais informados.
// - ZCoins estão com 50% de desconto no Beta.
// - Veículos estão todos temporariamente por R$ 50,00.
// - Veículos com preço futuro/original temporário de R$ 100,00.
// - Todos os pedidos serão manuais nesta fase.
//
// ==================================================

const betaPackages = [
  {
    id: "beta-sobrevivente",
    name: "Sobrevivente Beta",
    category: "beta",
    type: "Acesso Beta",
    priceCents: 1000,
    originalPriceCents: 1000,
    betaDiscount: false,
    stock: 15,
    available: true,
    highlight: false,
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
    id: "beta-explorador",
    name: "Explorador Beta",
    category: "beta",
    type: "Acesso Beta",
    priceCents: 3000,
    originalPriceCents: 3000,
    betaDiscount: false,
    stock: 10,
    available: true,
    highlight: true,
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
    id: "fundador-survivalz",
    name: "Fundador SurvivalZ",
    category: "beta",
    type: "Acesso Beta",
    priceCents: 5000,
    originalPriceCents: 5000,
    betaDiscount: false,
    stock: 5,
    available: true,
    highlight: false,
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
  }
];

// ==================================================
// 💎 VIPs — COMPRA DIRETA
// ==================================================

const vipProducts = [
  {
    id: "vip-gold",
    name: "VIP Gold",
    category: "vip",
    type: "VIP",
    priceCents: 1490,
    originalPriceCents: 1990,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "VIP Gold mensal com valor promocional durante o Beta.",
    benefits: [
      "VIP Gold por 30 dias",
      "Valor mensal original: R$ 19,90",
      "Valor promocional Beta: R$ 14,90",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "vip-platina",
    name: "VIP Platina",
    category: "vip",
    type: "VIP",
    priceCents: 2490,
    originalPriceCents: 3490,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "VIP Platina mensal com valor promocional durante o Beta.",
    benefits: [
      "VIP Platina por 30 dias",
      "Valor mensal original: R$ 34,90",
      "Valor promocional Beta: R$ 24,90",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "vip-safira",
    name: "VIP Safira",
    category: "vip",
    type: "VIP",
    priceCents: 3990,
    originalPriceCents: 4990,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: true,
    description: "VIP Safira mensal com valor promocional durante o Beta.",
    benefits: [
      "VIP Safira por 30 dias",
      "Valor mensal original: R$ 49,90",
      "Valor promocional Beta: R$ 39,90",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "vip-zombie",
    name: "VIP Zombie",
    category: "vip",
    type: "VIP",
    priceCents: 5990,
    originalPriceCents: 7990,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "VIP Zombie mensal com valor promocional durante o Beta.",
    benefits: [
      "VIP Zombie por 30 dias",
      "Valor mensal original: R$ 79,90",
      "Valor promocional Beta: R$ 59,90",
      "Entrega manual após aprovação"
    ]
  }
];

// ==================================================
// 🪙 ZCOINS — PREÇO BETA COM 50% DE DESCONTO
// ==================================================

const zcoinProducts = [
  {
    id: "zcoins-500",
    name: "500 ZCoins",
    category: "zcoins",
    type: "ZCoins",
    priceCents: 250,
    originalPriceCents: 500,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "Pacote com 500 ZCoins.",
    benefits: [
      "500 ZCoins",
      "Preço original: R$ 5,00",
      "Preço Beta: R$ 2,50",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "zcoins-1200",
    name: "1.200 ZCoins",
    category: "zcoins",
    type: "ZCoins",
    priceCents: 500,
    originalPriceCents: 1000,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "Pacote com 1.200 ZCoins e bônus aproximado de 20%.",
    benefits: [
      "1.200 ZCoins",
      "Bônus aproximado: +20%",
      "Preço original: R$ 10,00",
      "Preço Beta: R$ 5,00",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "zcoins-2800",
    name: "2.800 ZCoins",
    category: "zcoins",
    type: "ZCoins",
    priceCents: 1000,
    originalPriceCents: 2000,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "Pacote com 2.800 ZCoins e bônus aproximado de 40%.",
    benefits: [
      "2.800 ZCoins",
      "Bônus aproximado: +40%",
      "Preço original: R$ 20,00",
      "Preço Beta: R$ 10,00",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "zcoins-4500",
    name: "4.500 ZCoins",
    category: "zcoins",
    type: "ZCoins",
    priceCents: 1500,
    originalPriceCents: 3000,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: true,
    description: "Pacote com 4.500 ZCoins e bônus aproximado de 50%.",
    benefits: [
      "4.500 ZCoins",
      "Bônus aproximado: +50%",
      "Preço original: R$ 30,00",
      "Preço Beta: R$ 15,00",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "zcoins-8000",
    name: "8.000 ZCoins",
    category: "zcoins",
    type: "ZCoins",
    priceCents: 2500,
    originalPriceCents: 5000,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "Pacote com 8.000 ZCoins e bônus aproximado de 60%.",
    benefits: [
      "8.000 ZCoins",
      "Bônus aproximado: +60%",
      "Preço original: R$ 50,00",
      "Preço Beta: R$ 25,00",
      "Entrega manual após aprovação"
    ]
  },

  {
    id: "zcoins-17500",
    name: "17.500 ZCoins",
    category: "zcoins",
    type: "ZCoins",
    priceCents: 5000,
    originalPriceCents: 10000,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: "Pacote com 17.500 ZCoins e bônus aproximado de 75%.",
    benefits: [
      "17.500 ZCoins",
      "Bônus aproximado: +75%",
      "Preço original: R$ 100,00",
      "Preço Beta: R$ 50,00",
      "Entrega manual após aprovação"
    ]
  }
];

// ==================================================
// 🚗 VEÍCULOS — TODOS TEMPORARIAMENTE POR R$ 50,00
// ==================================================

const vehicleData = [
  // Veículos Loja
  {
    id: "vehicle-infernus-411",
    name: "Infernus",
    modelId: 411,
    categoryLabel: "Veículos Loja",
    capacity: "40kg"
  },
  {
    id: "vehicle-cheetah-415",
    name: "Cheetah",
    modelId: 415,
    categoryLabel: "Veículos Loja",
    capacity: "40kg"
  },
  {
    id: "vehicle-comet-480",
    name: "Comet",
    modelId: 480,
    categoryLabel: "Veículos Loja",
    capacity: "40kg"
  },
  {
    id: "vehicle-nrg-500-522",
    name: "NRG-500",
    modelId: 522,
    categoryLabel: "Veículos Loja",
    capacity: "20kg"
  },
  {
    id: "vehicle-fbi-truck-528",
    name: "FBI Truck",
    modelId: 528,
    categoryLabel: "Veículos Loja",
    capacity: "70kg",
    armor: "Blindado Tier 3"
  },
  {
    id: "vehicle-fbi-rancher-490",
    name: "FBI Rancher",
    modelId: 490,
    categoryLabel: "Veículos Loja",
    capacity: "60kg"
  },
  {
    id: "vehicle-bullet-541",
    name: "Bullet",
    modelId: 541,
    categoryLabel: "Veículos Loja",
    capacity: "40kg"
  },
  {
    id: "vehicle-monster-a-556",
    name: "Monster A",
    modelId: 556,
    categoryLabel: "Veículos Loja",
    capacity: "40kg"
  },
  {
    id: "vehicle-bandito-568",
    name: "Bandito",
    modelId: 568,
    categoryLabel: "Veículos Loja",
    capacity: "20kg"
  },
  {
    id: "vehicle-swat-601",
    name: "SWAT",
    modelId: 601,
    categoryLabel: "Veículos Loja",
    capacity: "70kg",
    armor: "Blindado Tier 3"
  },
  {
    id: "vehicle-turismo-451",
    name: "Turismo",
    modelId: 451,
    categoryLabel: "Veículos Loja",
    capacity: "40kg"
  },
  {
    id: "vehicle-enforcer-427",
    name: "Enforcer",
    modelId: 427,
    categoryLabel: "Veículos Loja",
    capacity: "120kg",
    armor: "Blindado Tier 2"
  },

  // Veículos Modificáveis VIP
  {
    id: "vehicle-roadtrain-515",
    name: "RoadTrain",
    modelId: 515,
    categoryLabel: "Veículos Modificáveis VIP"
  },
  {
    id: "vehicle-sultan-560",
    name: "Sultan",
    modelId: 560,
    categoryLabel: "Veículos Modificáveis VIP"
  },
  {
    id: "vehicle-hotknife-434",
    name: "Hotknife",
    modelId: 434,
    categoryLabel: "Veículos Modificáveis VIP"
  },
  {
    id: "vehicle-romero-442",
    name: "Romero",
    modelId: 442,
    categoryLabel: "Veículos Modificáveis VIP"
  },
  {
    id: "vehicle-camper-483",
    name: "Camper",
    modelId: 483,
    categoryLabel: "Veículos Modificáveis VIP"
  },
  {
    id: "vehicle-slamvan-535",
    name: "Slamvan",
    modelId: 535,
    categoryLabel: "Veículos Modificáveis VIP"
  },
  {
    id: "vehicle-glendale-damaged-604",
    name: "Glendale Damaged",
    modelId: 604,
    categoryLabel: "Veículos Modificáveis VIP"
  },

  // Caminhões
  {
    id: "truck-boxville-398",
    name: "Boxville",
    modelId: 398,
    categoryLabel: "Caminhões",
    capacity: "300kg"
  },
  {
    id: "truck-firetruck-407",
    name: "Firetruck",
    modelId: 407,
    categoryLabel: "Caminhões",
    capacity: "400kg"
  },
  {
    id: "truck-barracks-433",
    name: "Barracks",
    modelId: 433,
    categoryLabel: "Caminhões",
    capacity: "600kg"
  },
  {
    id: "truck-mr-whoopee-423",
    name: "Mr. Whoopee",
    modelId: 423,
    categoryLabel: "Caminhões",
    capacity: "700kg"
  },
  {
    id: "truck-dune-573",
    name: "Dune",
    modelId: 573,
    categoryLabel: "Caminhões",
    capacity: "900kg"
  },

  // Helicópteros
  {
    id: "heli-cargobob-548",
    name: "Cargobob",
    modelId: 548,
    categoryLabel: "Helicópteros",
    capacity: "600kg",
    armor: "Blindado"
  },
  {
    id: "heli-leviathan-417",
    name: "Leviathan",
    modelId: 417,
    categoryLabel: "Helicópteros",
    capacity: "500kg",
    armor: "Blindado"
  },
  {
    id: "heli-raindance-563",
    name: "Raindance",
    modelId: 563,
    categoryLabel: "Helicópteros",
    capacity: "400kg",
    armor: "Blindado"
  },
  {
    id: "heli-sparrow-469",
    name: "Sparrow",
    modelId: 469,
    categoryLabel: "Helicópteros",
    capacity: "60kg"
  },
  {
    id: "heli-maverick-487",
    name: "Maverick",
    modelId: 487,
    categoryLabel: "Helicópteros",
    capacity: "70kg"
  },
  {
    id: "heli-police-maverick-497",
    name: "Police Maverick",
    modelId: 497,
    categoryLabel: "Helicópteros",
    capacity: "70kg"
  },

  // Aviões
  {
    id: "plane-rustler-476",
    name: "Rustler",
    modelId: 476,
    categoryLabel: "Aviões"
  },
  {
    id: "plane-stunt-513",
    name: "Stunt",
    modelId: 513,
    categoryLabel: "Aviões"
  },
  {
    id: "plane-dodo-593",
    name: "Dodo",
    modelId: 593,
    categoryLabel: "Aviões"
  },

  // Coleção Ilha
  {
    id: "boat-predator-430",
    name: "Predator",
    modelId: 430,
    categoryLabel: "Coleção Ilha",
    collection: "Coleção Polícia"
  },
  {
    id: "boat-jetmax-493",
    name: "Jetmax",
    modelId: 493,
    categoryLabel: "Coleção Ilha"
  },
  {
    id: "plane-skimmer-460",
    name: "Skimmer",
    modelId: 460,
    categoryLabel: "Coleção Ilha"
  },
  {
    id: "boat-speeder-452",
    name: "Speeder",
    modelId: 452,
    categoryLabel: "Coleção Ilha"
  },
  {
    id: "boat-tropic-454",
    name: "Tropic",
    modelId: 454,
    categoryLabel: "Coleção Ilha"
  },
  {
    id: "boat-dinghy-473",
    name: "Dinghy",
    modelId: 473,
    categoryLabel: "Coleção Ilha"
  },
  {
    id: "boat-marquis-484",
    name: "Marquis",
    modelId: 484,
    categoryLabel: "Coleção Ilha",
    capacity: "200kg"
  }
];

const vehicleProducts = vehicleData.map((vehicle) => {
  const benefits = [
    `Modelo ${vehicle.modelId}`,
    `Categoria: ${vehicle.categoryLabel}`,
    "Preço Beta: R$ 50,00",
    "Entrega manual após aprovação"
  ];

  if (vehicle.capacity) {
    benefits.splice(2, 0, `Capacidade: ${vehicle.capacity}`);
  }

  if (vehicle.armor) {
    benefits.splice(2, 0, vehicle.armor);
  }

  if (vehicle.collection) {
    benefits.splice(2, 0, vehicle.collection);
  }

  return {
    id: vehicle.id,
    name: vehicle.name,
    category: "vehicles",
    type: vehicle.categoryLabel,
    modelId: vehicle.modelId,
    capacity: vehicle.capacity || null,
    armor: vehicle.armor || null,
    collection: vehicle.collection || null,
    priceCents: 5000,
    originalPriceCents: 10000,
    betaDiscount: true,
    stock: null,
    available: true,
    highlight: false,
    description: `${vehicle.name} disponível na loja com preço promocional de Beta.`,
    benefits
  };
});

// ==================================================
// 📦 TODOS OS PRODUTOS
// ==================================================

const products = [
  ...betaPackages,
  ...vipProducts,
  ...zcoinProducts,
  ...vehicleProducts
];

// ==================================================
// 🛠️ FUNÇÕES UTILITÁRIAS
// ==================================================

const getAllProducts = () => {
  return products;
};

const getAvailableProducts = () => {
  return products.filter((product) => product.available);
};

const getProductById = (id) => {
  return products.find((product) => product.id === id);
};

const getProductsByCategory = (category) => {
  return products.filter((product) => product.category === category);
};

const formatPrice = (priceCents) => {
  if (priceCents === null || priceCents === undefined) {
    return "A definir";
  }

  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

module.exports = {
  products,
  betaPackages,
  vipProducts,
  zcoinProducts,
  vehicleProducts,
  getAllProducts,
  getAvailableProducts,
  getProductById,
  getProductsByCategory,
  formatPrice
};