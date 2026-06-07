const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderNotes
} = require("../models/orderModel");

const { formatPrice } = require("../data/products");
const { getPixInfoForOrder } = require("../utils/pixUtils");
const prisma = require("../config/prisma");

const renderAdminHome = async (req, res) => {
  const orders = getAllOrders();
  const [usersCount, topicsCount, reportsCount, medalsCount] = await Promise.all([
    prisma.user.count(),
    prisma.forumTopic.count(),
    prisma.forumTopic.count({
      where: {
        category: {
          slug: "denuncias"
        }
      }
    }),
    prisma.medal.count()
  ]);

  res.render("pages/admin-home", {
    title: "Painel Desenvolvedor - Central SurvivalZ",
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => order.status === "pendente").length,
    paidOrders: orders.filter((order) => order.status === "pago").length,
    deliveredOrders: orders.filter((order) => order.status === "entregue").length,
    siteOverview: {
      usersCount,
      topicsCount,
      reportsCount,
      medalsCount
    }
  });
};

const renderAdminOrders = (req, res) => {
  const filter = req.query.status || "todos";
  const search = req.query.q ? req.query.q.trim().toLowerCase() : "";

  const allOrders = getAllOrders();

  let orders = [...allOrders].reverse();

  if (filter !== "todos") {
    orders = orders.filter((order) => order.status === filter);
  }

  if (search) {
    orders = orders.filter((order) => {
      const code = String(order.code || "").toLowerCase();
      const name = String(order.customer.name || "").toLowerCase();
      const discord = String(order.customer.discord || "").toLowerCase();
      const email = String(order.customer.email || "").toLowerCase();
      const sampNick = String(order.customer.sampNick || "").toLowerCase();

      return (
        code.includes(search) ||
        name.includes(search) ||
        discord.includes(search) ||
        email.includes(search) ||
        sampNick.includes(search)
      );
    });
  }

  const counters = {
    todos: allOrders.length,
    pendente: allOrders.filter((order) => order.status === "pendente").length,
    pago: allOrders.filter((order) => order.status === "pago").length,
    entregue: allOrders.filter((order) => order.status === "entregue").length,
    recusado: allOrders.filter((order) => order.status === "recusado").length
  };

  res.render("pages/admin-pedidos", {
    title: "Pedidos - Painel Admin",
    orders,
    filter,
    search,
    counters,
    formatPrice
  });
};

const renderAdminOrderDetails = async (req, res) => {
  const order = getOrderById(req.params.id);

  if (!order) {
    return res.status(404).render("pages/404", {
      title: "Pedido não encontrado - Central SurvivalZ"
    });
  }

  res.render("pages/admin-pedido-detalhes", {
    title: `Pedido ${order.code} - Painel Admin`,
    order,
    pixInfo: await getPixInfoForOrder(order),
    formatPrice
  });
};

const updateAdminOrderStatus = (req, res) => {
  const { action } = req.body;

  let updateData = null;

  if (action === "pago") {
    updateData = {
      status: "pago",
      paymentStatus: "pago"
    };
  }

  if (action === "entregue") {
    updateData = {
      status: "entregue",
      paymentStatus: "pago",
      deliveryStatus: "entregue"
    };
  }

  if (action === "recusado") {
    updateData = {
      status: "recusado",
      paymentStatus: "recusado",
      deliveryStatus: "cancelado"
    };
  }

  if (!updateData) {
    return res.status(400).send("Ação inválida.");
  }

  const updatedOrder = updateOrderStatus(req.params.id, updateData);

  if (!updatedOrder) {
    return res.status(404).render("pages/404", {
      title: "Pedido não encontrado - Central SurvivalZ"
    });
  }

  res.redirect(`/admin/pedidos/${req.params.id}`);
};

const renderAdminLogin = (req, res) => {
  res.render("pages/admin-login", {
    title: "Login Admin - Central SurvivalZ",
    error: null
  });
};

const loginAdmin = (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.render("pages/admin-login", {
      title: "Login Admin - Central SurvivalZ",
      error: "Digite a senha de administrador."
    });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.render("pages/admin-login", {
      title: "Login Admin - Central SurvivalZ",
      error: "Senha incorreta."
    });
  }

  req.session.isAdminLogged = true;

  return res.redirect("/admin");
};

const logoutAdmin = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.log("Erro ao sair do admin:", error);
      return res.redirect("/admin");
    }

    res.clearCookie("connect.sid");

    return res.redirect("/admin/login");
  });
};

const updateAdminOrderNotes = (req, res) => {
  const { internalNotes } = req.body;

  const updatedOrder = updateOrderNotes(req.params.id, internalNotes || "");

  if (!updatedOrder) {
    return res.status(404).render("pages/404", {
      title: "Pedido não encontrado - Central SurvivalZ"
    });
  }

  res.redirect(`/admin/pedidos/${req.params.id}`);
};

const escapeCsv = (value) => {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const exportOrdersJson = (req, res) => {
  const orders = getAllOrders();

  const fileName = `survivalz-pedidos-${new Date().toISOString().slice(0, 10)}.json`;

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  return res.send(JSON.stringify(orders, null, 2));
};

const exportOrdersCsv = (req, res) => {
  const orders = getAllOrders();

  const headers = [
    "codigo",
    "status",
    "pagamento",
    "entrega",
    "nome",
    "discord",
    "email",
    "nick_servidor",
    "cupom",
    "subtotal_centavos",
    "desconto_centavos",
    "total_centavos",
    "total_formatado",
    "itens",
    "observacoes_cliente",
    "observacoes_internas",
    "criado_em",
    "atualizado_em"
  ];

  const rows = orders.map((order) => {
    const items = order.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(" | ");

    return [
      order.code,
      order.status,
      order.paymentStatus,
      order.deliveryStatus,
      order.customer.name,
      order.customer.discord,
      order.customer.email,
      order.customer.sampNick,
      order.coupon || "",
      order.subtotal,
      order.discount,
      order.total,
      formatPrice(order.total),
      items,
      order.customer.notes || "",
      order.internalNotes || "",
      order.createdAt,
      order.updatedAt || ""
    ].map(escapeCsv).join(";");
  });

  const csv = [headers.join(";"), ...rows].join("\n");

  const fileName = `survivalz-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");

  return res.send("\uFEFF" + csv);
};

module.exports = {
  renderAdminHome,
  renderAdminOrders,
  renderAdminOrderDetails,
  updateAdminOrderStatus,
  updateAdminOrderNotes,
  exportOrdersJson,
  exportOrdersCsv,
  renderAdminLogin,
  loginAdmin,
  logoutAdmin
};
