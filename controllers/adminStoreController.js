const prisma = require("../config/prisma");

const slugify = (text) => {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const parseNullableInt = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
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

const renderAdminStoreProducts = async (req, res) => {
  const products = await prisma.storeProduct.findMany({
    orderBy: [
      { position: "asc" },
      { createdAt: "desc" }
    ]
  });

  res.render("pages/admin-store-products", {
    title: "Produtos da Loja - Painel Admin",
    products
  });
};

const renderAdminStoreProductNew = (req, res) => {
  res.render("pages/admin-store-product-form", {
    title: "Novo Produto - Painel Admin",
    product: null,
    benefitsText: "",
    action: "/admin/loja/produtos/novo"
  });
};

const createAdminStoreProduct = async (req, res) => {
  const {
    code,
    name,
    slug,
    category,
    type,
    priceZCoins,
    referencePriceCents,
    description,
    benefits,
    imageUrl,
    modelId,
    capacityKg,
    armorTier,
    collection,
    stock,
    isActive,
    isFeatured,
    position
  } = req.body;

  const finalSlug = slugify(slug || name);
  const finalCode = code || finalSlug;

  await prisma.storeProduct.create({
    data: {
      code: finalCode,
      name,
      slug: finalSlug,
      category,
      type: type || null,
      priceZCoins: parseNullableInt(priceZCoins),
      referencePriceCents: parseNullableInt(referencePriceCents),
      description: description || null,
      benefits: parseBenefits(benefits),
      imageUrl: imageUrl || null,
      modelId: parseNullableInt(modelId),
      capacityKg: parseNullableInt(capacityKg),
      armorTier: armorTier || null,
      collection: collection || null,
      stock: parseNullableInt(stock),
      isActive: isActive === "on",
      isFeatured: isFeatured === "on",
      position: parseNullableInt(position) || 0
    }
  });

  res.redirect("/admin/loja/produtos");
};

const renderAdminStoreProductEdit = async (req, res) => {
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

  res.render("pages/admin-store-product-form", {
    title: `Editar ${product.name} - Painel Admin`,
    product,
    benefitsText: benefitsToText(product.benefits),
    action: `/admin/loja/produtos/${product.id}/editar`
  });
};

const updateAdminStoreProduct = async (req, res) => {
  const {
    code,
    name,
    slug,
    category,
    type,
    priceZCoins,
    referencePriceCents,
    description,
    benefits,
    imageUrl,
    modelId,
    capacityKg,
    armorTier,
    collection,
    stock,
    isActive,
    isFeatured,
    position
  } = req.body;

  const finalSlug = slugify(slug || name);

  await prisma.storeProduct.update({
    where: {
      id: req.params.id
    },
    data: {
      code,
      name,
      slug: finalSlug,
      category,
      type: type || null,
      priceZCoins: parseNullableInt(priceZCoins),
      referencePriceCents: parseNullableInt(referencePriceCents),
      description: description || null,
      benefits: parseBenefits(benefits),
      imageUrl: imageUrl || null,
      modelId: parseNullableInt(modelId),
      capacityKg: parseNullableInt(capacityKg),
      armorTier: armorTier || null,
      collection: collection || null,
      stock: parseNullableInt(stock),
      isActive: isActive === "on",
      isFeatured: isFeatured === "on",
      position: parseNullableInt(position) || 0
    }
  });

  res.redirect("/admin/loja/produtos");
};

const toggleAdminStoreProduct = async (req, res) => {
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

  res.redirect("/admin/loja/produtos");
};

module.exports = {
  renderAdminStoreProducts,
  renderAdminStoreProductNew,
  createAdminStoreProduct,
  renderAdminStoreProductEdit,
  updateAdminStoreProduct,
  toggleAdminStoreProduct
};