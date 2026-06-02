const fs = require("fs");
const path = require("path");

const ordersPath = path.join(__dirname, "..", "data", "orders.json");

const readOrders = () => {
  if (!fs.existsSync(ordersPath)) {
    fs.writeFileSync(ordersPath, "[]");
  }

  const data = fs.readFileSync(ordersPath, "utf-8");
  return JSON.parse(data);
};

const saveOrders = (orders) => {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
};

const createOrder = (orderData) => {
  const orders = readOrders();

  const newOrder = {
    id: orders.length + 1,
    code: `SZ-${String(orders.length + 1).padStart(4, "0")}`,
    status: "pendente",
    createdAt: new Date().toISOString(),
    ...orderData
  };

  orders.push(newOrder);
  saveOrders(orders);

  return newOrder;
};

const getAllOrders = () => {
  return readOrders();
};

const getOrderById = (id) => {
  const orders = readOrders();
  return orders.find((order) => order.id === Number(id));
};

const updateOrderStatus = (id, updateData) => {
  const orders = readOrders();

  const orderIndex = orders.findIndex((order) => order.id === Number(id));

  if (orderIndex === -1) {
    return null;
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  saveOrders(orders);

  return orders[orderIndex];
};

const getOrderByCode = (code) => {
  const orders = readOrders();

  return orders.find((order) => {
    return String(order.code).toLowerCase() === String(code).toLowerCase();
  });
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByCode,
  updateOrderStatus
};