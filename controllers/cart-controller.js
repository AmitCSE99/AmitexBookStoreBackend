const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Product = require("../models/Book");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const addToCart = async (req, res, next) => {
  const { item, userId, productId } = req.body;
  let currentUser;
  let currentBook;
  try {
    currentUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 401));
  }
  if (!currentUser) {
    return next(new HttpError("User not found", 401));
  }
  try {
    currentBook = await Product.findById(productId);
  } catch (err) {
    return next(new HttpError("Could not find the book", 500));
  }
  const totalPrice = currentUser.cart.totalPrice + currentBook.price;
  const cartProductIndex = currentUser.cart.items.findIndex((cp) => {
    return cp.productId.toString() === productId.toString();
  });
  if (cartProductIndex != -1) {
    const error = new HttpError("Item already in the cart!", 500);
    return next(error);
  }
  currentUser.cart.totalPrice = totalPrice;
  currentUser.cart.items.push(item);
  try {
    await currentUser.save();
  } catch (err) {
    return next(new HttpError("Could not add to cart", 500));
  }
  res.json({ user: currentUser.toObject({ getters: true }) });
};

const removeCart = async (req, res, next) => {
  const { productId, userId } = req.body;
  let identifiedUser;
  let product;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went wrong", 401);
    return next(error);
  }
  if (!identifiedUser) {
    const error = new HttpError("Something went wrong", 401);
    return next(error);
  }
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
  const updatedCartItems = identifiedUser.cart.items.filter((items) => {
    return items.productId.toString() != productId.toString();
  });
  let newTotalPrice =
    parseInt(identifiedUser.cart.totalPrice) - parseInt(product.price);
  identifiedUser.cart.items = updatedCartItems;
  identifiedUser.cart.totalPrice = newTotalPrice;
  try {
    await identifiedUser.save();
  } catch (err) {
    const error = new HttpError("Could not the user", 500);
    return next(error);
  }
  console.log(updatedCartItems);
  res.json({
    items: identifiedUser.cart.items,
    totalPrice: identifiedUser.cart.totalPrice,
  });
};

const getCart = async (req, res, next) => {
  const userId = req.params.userId;
  let indentifiedUser;
  try {
    indentifiedUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went error", 500);
    return next(error);
  }
  if (!indentifiedUser) {
    const error = new HttpError("User Not found", 401);
    return next(error);
  }
  res.json({
    items: indentifiedUser.cart.items,
    totalPrice: indentifiedUser.cart.totalPrice,
  });
};

exports.addToCart = addToCart;
exports.getCart = getCart;
exports.removeCart = removeCart;
