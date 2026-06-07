const fs = require("fs");
const path = require("path");

const dataDir = process.env.ORDERS_DATA_DIR
  ? process.env.ORDERS_DATA_DIR
  : path.join(__dirname, "..", "data");

const ordersPath = path.join(dataDir, "orders.json");
const backupsDir = path.join(dataDir, "backups");

const readOrders = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(ordersPath)) {
    fs.writeFileSync(ordersPath, "[]");
  }

  const data = fs.readFileSync(ordersPath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(data);
};

const createOrdersBackup = (orders) => {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\./g, "-");

  const backupPath = path.join(backupsDir, `orders-backup-${timestamp}.json`);

  fs.writeFileSync(backupPath, JSON.stringify(orders, null, 2));
};

const saveOrders = (orders) => {
  createOrdersBackup(orders);
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
};

const createOrder = async (orderData) => {
  const orders = readOrders();
  const baseOrder = {
    id: orders.length + 1,
    code: `SZ-${String(orders.length + 1).padStart(4, "0")}`,
    status: "pendente",
    createdAt: new Date().toISOString()
  };

  const resolvedOrderData = typeof orderData === "function"
    ? await orderData(baseOrder)
    : orderData;

  const newOrder = {
    ...baseOrder,
    ...resolvedOrderData
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

const getOrdersByUserId = (userId) => {
  const orders = readOrders();
  const normalizedUserId = String(userId || "");

  if (!normalizedUserId) return [];

  return orders.filter((order) => {
    return String(order.userId || "") === normalizedUserId;
  });
};

const getOrderByIdForUser = (id, userId) => {
  const order = getOrderById(id);

  if (!order || String(order.userId || "") !== String(userId || "")) {
    return null;
  }

  return order;
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

const updateOrderNotes = (id, internalNotes) => {
  const orders = readOrders();

  const orderIndex = orders.findIndex((order) => order.id === Number(id));

  if (orderIndex === -1) {
    return null;
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    internalNotes,
    updatedAt: new Date().toISOString()
  };

  saveOrders(orders);

  return orders[orderIndex];
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  getOrderByIdForUser,
  getOrderByCode,
  updateOrderStatus,
  updateOrderNotes
};
