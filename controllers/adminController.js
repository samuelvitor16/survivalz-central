const {
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require("../models/orderModel");

const { formatPrice } = require("../data/products");

const renderAdminHome = (req, res) => {
  const orders = getAllOrders();

  res.render("pages/admin-home", {
    title: "Painel Admin - Central SurvivalZ",
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => order.status === "pendente").length,
    paidOrders: orders.filter((order) => order.status === "pago").length,
    deliveredOrders: orders.filter((order) => order.status === "entregue").length
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

const renderAdminOrderDetails = (req, res) => {
  const order = getOrderById(req.params.id);

  if (!order) {
    return res.status(404).render("pages/404", {
      title: "Pedido não encontrado - Central SurvivalZ"
    });
  }

  res.render("pages/admin-pedido-detalhes", {
    title: `Pedido ${order.code} - Painel Admin`,
    order,
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

module.exports = {
  renderAdminHome,
  renderAdminOrders,
  renderAdminOrderDetails,
  updateAdminOrderStatus,
  renderAdminLogin,
  loginAdmin,
  logoutAdmin
};