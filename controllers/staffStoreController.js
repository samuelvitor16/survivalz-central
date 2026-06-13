const prisma = require("../config/prisma");

const CATEGORY_OPTIONS = [
  { value: "zcoins", label: "Pacotes de ZCoins", hint: "Produto comprado com dinheiro e entregue como saldo de ZCoins." },
  { value: "vip", label: "VIP / Premium", hint: "Planos mensais comprados com ZCoins." },
  { value: "vehicles", label: "Veículos", hint: "Carros, caminhões, helicópteros, aviões e barcos." },
  { value: "skins", label: "Skins", hint: "Skins comuns, raras, exclusivas e limitadas." },
  { value: "accessories", label: "Acessórios", hint: "Acessórios cosméticos ou colecionáveis." },
  { value: "season_pass", label: "Passe de temporada", hint: "Passe premium e versões com níveis iniciais." },
  { value: "special_packages", label: "Pacotes especiais", hint: "Pacotes de entrada, fundador, veterano etc." },
  { value: "crates", label: "Caixas", hint: "Caixas com recompensas cosméticas e colecionáveis." },
  { value: "beta", label: "Pacotes Beta", hint: "Acessos e pacotes especiais do beta." }
];

const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

const VEHICLE_CATEGORIES = new Set(["vehicles"]);

const slugify = (text) => {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `produto-${Date.now()}`;
};

const parseNullableInt = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(String(value).replace(/\./g, "").replace(",", "."));

  return Number.isFinite(number) ? Math.round(number) : null;
};

const parseMoneyToCents = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const normalized = String(value)
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = Number(normalized);

  return Number.isFinite(number) ? Math.round(number * 100) : null;
};

const formatCurrency = (cents) => {
  if (cents === null || cents === undefined) return "A definir";

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

const formatZCoins = (value) => {
  if (value === null || value === undefined) return "A definir";
  return `${Number(value).toLocaleString("pt-BR")} ZCoins`;
};

const centsToInput = (cents) => {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
};

const parseBenefits = (text) => {
  if (!text) return [];

  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const benefitsToText = (benefits) => {
  if (!benefits) return "";

  if (Array.isArray(benefits)) {
    return benefits.join("\n");
  }

  return "";
};

const normalizeProductForView = (product) => {
  return {
    ...product,
    categoryLabel: CATEGORY_LABELS[product.category] || product.category,
    referencePriceLabel: formatCurrency(product.referencePriceCents),
    priceZCoinsLabel: formatZCoins(product.priceZCoins),
    isVehicleCategory: VEHICLE_CATEGORIES.has(product.category)
  };
};

const buildFormData = (product = null) => {
  return {
    name: product ? product.name : "",
    category: product ? product.category : "zcoins",
    type: product && product.type ? product.type : "",
    priceZCoins: product && product.priceZCoins !== null && product.priceZCoins !== undefined ? product.priceZCoins : "",
    referencePrice: product ? centsToInput(product.referencePriceCents) : "",
    description: product && product.description ? product.description : "",
    benefits: benefitsToText(product ? product.benefits : []),
    imageUrl: product && product.imageUrl ? product.imageUrl : "",
    modelId: product && product.modelId ? product.modelId : "",
    capacityKg: product && product.capacityKg ? product.capacityKg : "",
    armorTier: product && product.armorTier ? product.armorTier : "",
    collection: product && product.collection ? product.collection : "",
    stock: product && product.stock !== null && product.stock !== undefined ? product.stock : "",
    isActive: product ? product.isActive : true,
    isFeatured: product ? product.isFeatured : false,
    position: product ? product.position : 0
  };
};

const makeUniqueSlug = async (baseSlug, ignoreId = null) => {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.storeProduct.findUnique({
      where: { slug }
    });

    if (!existing || existing.id === ignoreId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const makeUniqueCode = async (baseCode, ignoreId = null) => {
  let code = baseCode;
  let suffix = 2;

  while (true) {
    const existing = await prisma.storeProduct.findUnique({
      where: { code }
    });

    if (!existing || existing.id === ignoreId) {
      return code;
    }

    code = `${baseCode}-${suffix}`;
    suffix += 1;
  }
};

const getProductDataFromBody = async (body, currentProduct = null) => {
  const baseSlug = slugify(body.name);
  const slug = await makeUniqueSlug(baseSlug, currentProduct ? currentProduct.id : null);
  const code = currentProduct ? currentProduct.code : await makeUniqueCode(baseSlug, null);

  return {
    code,
    name: String(body.name || "").trim(),
    slug,
    category: body.category,
    type: body.type ? String(body.type).trim() : null,
    priceZCoins: parseNullableInt(body.priceZCoins),
    referencePriceCents: parseMoneyToCents(body.referencePrice),
    description: body.description ? String(body.description).trim() : null,
    benefits: parseBenefits(body.benefits),
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
    modelId: parseNullableInt(body.modelId),
    capacityKg: parseNullableInt(body.capacityKg),
    armorTier: body.armorTier ? String(body.armorTier).trim() : null,
    collection: body.collection ? String(body.collection).trim() : null,
    stock: parseNullableInt(body.stock),
    isActive: body.isActive === "on",
    isFeatured: body.isFeatured === "on",
    position: parseNullableInt(body.position) || 0
  };
};

const renderAdminStoreProducts = async (req, res) => {
  return renderStaffStoreProducts(req, res);
};

const renderStaffStoreProducts = async (req, res) => {
  const category = req.query.category || "all";
  const search = req.query.q ? String(req.query.q).trim().toLowerCase() : "";

  const where = {};

  if (category !== "all") {
    where.category = category;
  }

  const productsRaw = await prisma.storeProduct.findMany({
    where,
    orderBy: [
      { position: "asc" },
      { createdAt: "desc" }
    ]
  });

  const filteredProducts = search
    ? productsRaw.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.type,
        product.description,
        product.modelId,
        product.collection,
        product.armorTier
      ].filter(Boolean).join(" ").toLowerCase();

      return haystack.includes(search);
    })
    : productsRaw;

  const allProducts = await prisma.storeProduct.findMany();
  const stats = {
    total: allProducts.length,
    active: allProducts.filter((product) => product.isActive).length,
    featured: allProducts.filter((product) => product.isFeatured).length,
    inactive: allProducts.filter((product) => !product.isActive).length
  };

  res.render("pages/staff-store-products", {
    title: "Loja - Painel Staff SurvivalZ",
    products: filteredProducts.map(normalizeProductForView),
    category,
    search,
    stats,
    categoryOptions: CATEGORY_OPTIONS,
    categoryLabels: CATEGORY_LABELS,
    formatCurrency,
    formatZCoins
  });
};

const renderStaffStoreProductNew = (req, res) => {
  res.render("pages/staff-store-product-form", {
    title: "Novo Produto - Loja Staff",
    product: null,
    form: buildFormData(),
    categoryOptions: CATEGORY_OPTIONS,
    action: "/staff/loja/produtos/novo",
    mode: "create"
  });
};

const createStaffStoreProduct = async (req, res) => {
  const data = await getProductDataFromBody(req.body);

  if (!data.name || !data.category) {
    return res.status(400).send("Nome e categoria sao obrigatorios.");
  }

  await prisma.storeProduct.create({ data });

  res.redirect("/staff/loja/produtos");
};

const renderStaffStoreProductEdit = async (req, res) => {
  const product = await prisma.storeProduct.findUnique({
    where: {
      id: req.params.id
    }
  });

  if (!product) {
    return res.status(404).render("pages/404", {
      title: "Produto não encontrado - Central SurvivalZ"
    });
  }

  res.render("pages/staff-store-product-form", {
    title: `Editar ${product.name} - Loja Staff`,
    product: normalizeProductForView(product),
    form: buildFormData(product),
    categoryOptions: CATEGORY_OPTIONS,
    action: `/staff/loja/produtos/${product.id}/editar`,
    mode: "edit"
  });
};

const updateStaffStoreProduct = async (req, res) => {
  const currentProduct = await prisma.storeProduct.findUnique({
    where: {
      id: req.params.id
    }
  });

  if (!currentProduct) {
    return res.status(404).render("pages/404", {
      title: "Produto não encontrado - Central SurvivalZ"
    });
  }

  const data = await getProductDataFromBody(req.body, currentProduct);

  await prisma.storeProduct.update({
    where: {
      id: currentProduct.id
    },
    data
  });

  res.redirect("/staff/loja/produtos");
};

const toggleStaffStoreProduct = async (req, res) => {
  const product = await prisma.storeProduct.findUnique({
    where: {
      id: req.params.id
    }
  });

  if (!product) {
    return res.status(404).render("pages/404", {
      title: "Produto não encontrado - Central SurvivalZ"
    });
  }

  await prisma.storeProduct.update({
    where: {
      id: product.id
    },
    data: {
      isActive: !product.isActive
    }
  });

  res.redirect("/staff/loja/produtos");
};

module.exports = {
  renderAdminStoreProducts,
  renderStaffStoreProducts,
  renderStaffStoreProductNew,
  createStaffStoreProduct,
  renderStaffStoreProductEdit,
  updateStaffStoreProduct,
  toggleStaffStoreProduct
};
