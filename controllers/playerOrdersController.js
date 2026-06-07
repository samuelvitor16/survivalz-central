const {
  getOrderByIdForUser,
  getOrdersByUserId
} = require("../models/orderModel");
const { formatPrice } = require("../data/products");
const { getPixInfoForOrder } = require("../utils/pixUtils");

const sortOrdersByDateDesc = (orders) => {
  return [...orders].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

const renderPlayerOrders = (req, res) => {
  const orders = sortOrdersByDateDesc(getOrdersByUserId(req.session.playerId));

  res.render("pages/player-orders", {
    title: "Meus pedidos - SurvivalZ",
    orders,
    formatPrice
  });
};

const renderPlayerOrderDetails = async (req, res) => {
  const order = getOrderByIdForUser(req.params.id, req.session.playerId);

  if (!order) {
    return res.status(404).render("pages/404", {
      title: "Pedido nao encontrado - Central SurvivalZ"
    });
  }

  res.render("pages/player-order-details", {
    title: `Pedido ${order.code} - SurvivalZ`,
    order,
    pixInfo: await getPixInfoForOrder(order),
    formatPrice
  });
};

module.exports = {
  renderPlayerOrders,
  renderPlayerOrderDetails,
  sortOrdersByDateDesc
};
