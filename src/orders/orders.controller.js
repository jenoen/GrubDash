const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  return res.json({ data: orders });
}

// validation for creation
function checkIfOrderHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function checksProperDishList(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes.length > 0 && Array.isArray(dishes)) {
    return next();
  }
  next({ status: 400, message: `Order must include at least one dish` });
}

function checksQuantityPerDish(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    if (dishes[i].quantity < 1 || !Number.isInteger(dishes[i].quantity)) {
      return next({
        status: 400,
        message: `Dish ${[
          i,
        ]} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// validation if order number exists

function orderNumberExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id == orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  return next({ status: 404, message: `Order does not exist: ${orderId}.` });
}

function read(req, res, next) {
  return res.json({ data: res.locals.order });
}

// validation for updating orders
function checkIfIdMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id) {
    if (id == orderId) {
      return next();
    }
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
    });
  }
  return next();
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  return next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function statusIsNotDelivered(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  return next();
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // Update the paste
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

// validation for deleting
function statusNotPending(req, res, next) {
  const selectedOrder = res.locals.order;
  if (selectedOrder.status !== "pending") {
    return next({
      status: 400,
      message:
        "An order cannot be deleted unless it is pending. Returns a 400 status code",
    });
  }
  return next();
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    checkIfOrderHas("deliverTo"),
    checkIfOrderHas("mobileNumber"),
    checkIfOrderHas("dishes"),
    checksProperDishList,
    checksQuantityPerDish,
    create,
  ],
  read: [orderNumberExists, read],
  update: [
    orderNumberExists,
    checkIfIdMatches,
    checkIfOrderHas("deliverTo"),
    checkIfOrderHas("mobileNumber"),
    checkIfOrderHas("status"),
    checkIfOrderHas("dishes"),
    statusIsValid,
    statusIsNotDelivered,
    checksProperDishList,
    checksQuantityPerDish,
    update,
  ],
  delete: [orderNumberExists, statusNotPending, destroy],
};
