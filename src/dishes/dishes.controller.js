// nextId is not used????

const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  return res.json({ data: dishes });
}

// validation for creation
function checkIfDishHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function checkIfPriceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price > 0 && Number.isInteger(price)) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  var id = nextId();
  const newDish = { name, description, price, image_url, id };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// validation for reading/getting specific dish
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function read(req, res, next) {
  return res.json({ data: res.locals.dish });
}

// validations for update dishes
function checkIfIdMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (id) {
    if (id != dishId) {
      return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
    return next();
  }
  // if no Id
  return next();
}

function update(req, res, next) {
  // gets the dish you wanted to update
  const newDish = res.locals.dish;
  // this gets the data from the request body
  const { data: { id, name, description, image_url, price } = {} } = req.body;
  // this edits the specific elements you wanted to update
  newDish.id = id;
  newDish.name = name;
  newDish.description = description;
  newDish.image_url = image_url;
  newDish.price = price;
  res.json({ data: newDish });
}

function destroy(req, res, next) {
  next({
    status: 405,
    message: `${req.method} not allowed for ${req.originalUrl}`,
  });
}

module.exports = {
  list,
  create: [
    checkIfDishHas("name"),
    checkIfDishHas("description"),
    checkIfDishHas("price"),
    checkIfDishHas("image_url"),
    checkIfPriceIsValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    checkIfDishHas("name"),
    checkIfDishHas("description"),
    checkIfDishHas("price"),
    checkIfDishHas("image_url"),
    checkIfPriceIsValid,
    checkIfIdMatches,
    update,
  ],
  delete: [destroy],
};
