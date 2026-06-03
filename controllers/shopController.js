const {
  getAvailableProducts,
  getProductById,
  formatPrice
} = require("../data/products");
const { generatePixPayment } = require("../utils/pixUtils");
const {
  createOrder,
  getAllOrders,
  getOrderByCode
} = require("../models/orderModel");

const renderShop = (req, res) => {
  const products = getAvailableProducts();

  const betaPackages = products.filter((product) => product.category === "beta");
  const vips = products.filter((product) => product.category === "vip");
  const zcoins = products.filter((product) => product.category === "zcoins");
  const vehicles = products.filter((product) => product.category === "vehicles");

  res.render("pages/loja", {
    title: "Loja Beta - Central SurvivalZ",
    betaPackages,
    vips,
    zcoins,
    vehicles,
    formatPrice
  });
};

const renderProduct = (req, res) => {
  const product = getProductById(req.params.id);

  if (!product || !product.available) {
    return res.status(404).render("pages/404", {
      title: "Produto não encontrado - Central SurvivalZ"
    });
  }

  res.render("pages/produto", {
    title: `${product.name} - Loja Beta SurvivalZ`,
    product,
    formatPrice
  });
};

const renderCheckout = (req, res) => {
  const product = getProductById(req.params.id);

  if (!product || !product.available) {
    return res.status(404).render("pages/404", {
      title: "Produto não encontrado - Central SurvivalZ"
    });
  }

  res.render("pages/checkout", {
    title: "Finalizar Pedido - Loja Beta SurvivalZ",
    product,
    formatPrice
  });
};

const renderCartCheckout = (req, res) => {
  res.render("pages/checkout", {
    title: "Checkout - Loja Beta SurvivalZ"
  });
};

const createCheckoutOrder = (req, res) => {
  try {
    const { customer, items, coupon } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dados do pedido inválidos."
      });
    }

    if (!customer.name || !customer.discord || !customer.email || !customer.sampNick) {
      return res.status(400).json({
        success: false,
        message: "Preencha todos os dados obrigatórios."
      });
    }

    const normalizedEmail = customer.email.trim().toLowerCase();
    const normalizedDiscord = customer.discord.trim().toLowerCase();
    const normalizedNick = customer.sampNick.trim().toLowerCase();

    const allOrders = getAllOrders();

    const alreadyUsedCoupon = allOrders.some((order) => {
      if (order.coupon !== "BETA25") return false;

      const orderEmail = order.customer.email.trim().toLowerCase();
      const orderDiscord = order.customer.discord.trim().toLowerCase();
      const orderNick = order.customer.sampNick.trim().toLowerCase();

      return (
        orderEmail === normalizedEmail ||
        orderDiscord === normalizedDiscord ||
        orderNick === normalizedNick
      );
    });

    const isSameCustomer = (order) => {
  if (!order.customer) return false;

  const orderEmail = String(order.customer.email || "").trim().toLowerCase();
  const orderDiscord = String(order.customer.discord || "").trim().toLowerCase();
  const orderNick = String(order.customer.sampNick || "").trim().toLowerCase();

  return (
    orderEmail === normalizedEmail ||
    orderDiscord === normalizedDiscord ||
    orderNick === normalizedNick
  );
};

const customerAlreadyHasCategory = (category) => {
  return allOrders.some((order) => {
    if (order.status === "recusado") return false;
    if (!isSameCustomer(order)) return false;

    return order.items.some((item) => {
      if (item.category) {
        return item.category === category;
      }

      const oldProduct = getProductById(item.id);
      return oldProduct && oldProduct.category === category;
    });
  });
};

    const shouldApplyCoupon = coupon === "BETA25";

    if (shouldApplyCoupon && alreadyUsedCoupon) {
      return res.status(400).json({
        success: false,
        message: "O cupom BETA25 já foi usado por este comprador."
      });
    }

    const requestedItems = {};

for (const item of items) {
  const quantity = Number(item.quantity);

  if (!item.id || !quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Quantidade inválida no carrinho."
    });
  }

  requestedItems[item.id] = (requestedItems[item.id] || 0) + quantity;
}

const getAlreadyReservedQuantity = (productId) => {
  return allOrders
    .filter((order) => order.status !== "recusado")
    .reduce((total, order) => {
      const productQuantity = order.items
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

      return total + productQuantity;
    }, 0);
};

const restrictedCategoriesInCart = {
  beta: 0
};

const validatedItems = [];

for (const productId of Object.keys(requestedItems)) {
  const product = getProductById(productId);

  if (!product || !product.available) {
    return res.status(400).json({
      success: false,
      message: `Produto inválido ou indisponível: ${productId}`
    });
  }

  const quantity = requestedItems[productId];

  if (quantity > 20) {
    return res.status(400).json({
      success: false,
      message: `Quantidade muito alta para o produto ${product.name}.`
    });
  }

  if (product.category === "beta") {
  const categoryLabel = "pacote Beta";

  if (quantity > 1) {
    return res.status(400).json({
      success: false,
      message: `Você só pode comprar 1 ${categoryLabel} por pedido.`
    });
  }

  restrictedCategoriesInCart.beta += quantity;

  if (restrictedCategoriesInCart.beta > 1) {
    return res.status(400).json({
      success: false,
      message: `Você só pode comprar 1 ${categoryLabel}. Remova os outros do carrinho.`
    });
  }

  if (customerAlreadyHasCategory("beta")) {
    return res.status(400).json({
      success: false,
      message: `Este comprador já possui um ${categoryLabel} registrado em outro pedido.`
    });
  }
}

  if (product.stock !== null && product.stock !== undefined) {
    const alreadyReserved = getAlreadyReservedQuantity(product.id);
    const availableStock = product.stock - alreadyReserved;

    if (availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: `${product.name} está sem vagas disponíveis no momento.`
      });
    }

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `${product.name} possui apenas ${availableStock} vaga(s) disponível(is).`
      });
    }
  }

  validatedItems.push({
    id: product.id,
    name: product.name,
    category: product.category,
    type: product.type,
    priceCents: product.priceCents,
    quantity,
    totalCents: product.priceCents * quantity
  });
}

    const subtotal = validatedItems.reduce((total, item) => {
      return total + item.totalCents;
    }, 0);

    const discount = shouldApplyCoupon ? Math.round(subtotal * 0.25) : 0;
    const total = subtotal - discount;

    const order = createOrder({
      customer: {
        name: customer.name.trim(),
        discord: customer.discord.trim(),
        email: normalizedEmail,
        sampNick: customer.sampNick.trim(),
        notes: customer.notes ? customer.notes.trim() : ""
      },
      items: validatedItems,
      subtotal,
      discount,
      total,
      coupon: shouldApplyCoupon ? "BETA25" : null,
      paymentStatus: "aguardando_pagamento",
      deliveryStatus: "pendente"
    });

    return res.status(201).json({
      success: true,
      message: "Pedido criado com sucesso.",
      order
    });

  } catch (error) {
    console.log("Erro ao criar pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar pedido."
    });
  }
};

const renderSuccess = async (req, res) => {
  const orderCode = req.query.pedido || null;

  let order = null;
  let pix = null;

  if (orderCode) {
    order = getOrderByCode(orderCode);

    if (order) {
      pix = await generatePixPayment({
        code: order.code,
        totalCents: order.total
      });
    }
  }

  res.render("pages/pedido-sucesso", {
  title: "Pedido Enviado - Central SurvivalZ",
  orderCode,
  order,
  pix,
  formatPrice,
  discordInvite: process.env.DISCORD_INVITE || "#"
});
};

const renderOrderConsult = (req, res) => {
  res.render("pages/consultar-pedido", {
    title: "Consultar Pedido - Loja Beta SurvivalZ",
    order: null,
    error: null,
    formatPrice
  });
};

const searchOrderConsult = (req, res) => {
  const { code, identifier } = req.body;

  if (!code || !identifier) {
    return res.render("pages/consultar-pedido", {
      title: "Consultar Pedido - Loja Beta SurvivalZ",
      order: null,
      error: "Informe o código do pedido e seu e-mail ou Discord.",
      formatPrice
    });
  }

  const order = getOrderByCode(code.trim());

  if (!order) {
    return res.render("pages/consultar-pedido", {
      title: "Consultar Pedido - Loja Beta SurvivalZ",
      order: null,
      error: "Pedido não encontrado.",
      formatPrice
    });
  }

  const searchValue = identifier.trim().toLowerCase();

  const orderEmail = String(order.customer.email || "").toLowerCase();
  const orderDiscord = String(order.customer.discord || "").toLowerCase();

  const isOwner =
    orderEmail === searchValue ||
    orderDiscord === searchValue;

  if (!isOwner) {
    return res.render("pages/consultar-pedido", {
      title: "Consultar Pedido - Loja Beta SurvivalZ",
      order: null,
      error: "Os dados informados não conferem com este pedido.",
      formatPrice
    });
  }

  return res.render("pages/consultar-pedido", {
    title: "Consultar Pedido - Loja Beta SurvivalZ",
    order,
    error: null,
    formatPrice
  });
};

const renderShopTerms = (req, res) => {
  res.render("pages/termos-loja", {
    title: "Termos da Loja Beta - SurvivalZ"
  });
};

module.exports = {
  renderShop,
  renderProduct,
  renderCheckout,
  renderCartCheckout,
  createCheckoutOrder,
  renderSuccess,
  renderOrderConsult,
  searchOrderConsult,
  renderShopTerms
};