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

    const shouldApplyCoupon = coupon === "BETA25";

    if (shouldApplyCoupon && alreadyUsedCoupon) {
      return res.status(400).json({
        success: false,
        message: "O cupom BETA25 já foi usado por este comprador."
      });
    }

    const validatedItems = [];

    for (const item of items) {
      const product = getProductById(item.id);

      if (!product || !product.available) {
        return res.status(400).json({
          success: false,
          message: `Produto inválido ou indisponível: ${item.name || item.id}`
        });
      }

      const quantity = Number(item.quantity);

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantidade inválida no carrinho."
        });
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
    formatPrice
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

module.exports = {
  renderShop,
  renderProduct,
  renderCheckout,
  renderCartCheckout,
  createCheckoutOrder,
  renderSuccess,
  renderOrderConsult,
  searchOrderConsult
};