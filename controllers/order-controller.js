const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Product = require("../models/Book");
const User = require("../models/User");
const Order = require("../models/Orders");
const mongoose = require("mongoose");

const getOrders = async (req, res, next) => {
  const userId = req.params.userId;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  let orders;
  try {
    orders = await Order.find({ userId: userId });
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (orders.length == 0) {
    return res.json({ orders: 0 });
  }
  res.json({
    orders: orders.map((order) => order.toObject({ getters: true })),
  });
};

const placeOrder = async (req, res, next) => {
  const { userId, addressId } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    console.log(err.message);
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  let products = [];
  let i = 0;
  for (i = 0; i < identifiedUser.cart.items.length; i++) {
    let product;
    try {
      product = await Product.findById(identifiedUser.cart.items[i].productId);
      let title = product.title;
      let image = product.image;
      let price = identifiedUser.cart.items[i].productPrice;
      let stockQuantity = product.stockQuantity;
      product.stockQuantity = stockQuantity - 1;
      products.push({
        title,
        image,
        price,
      });
      await product.save();
    } catch (err) {
      return next(new HttpError("Something went wrong"));
    }
  }
  const addressIndex = identifiedUser.address.findIndex((address) => {
    return address.id === addressId;
  });
  const subTotal = identifiedUser.cart.totalPrice;
  const address = identifiedUser.address[addressIndex].location;
  const user = {
    name: identifiedUser.username,
    contactNo: identifiedUser.contactNo,
  };
  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let fullDate = date + "/" + month + "/" + year;
  const newOrder = new Order({
    products,
    userId,
    user,
    address,
    date: fullDate,
    subTotal,
  });
  identifiedUser.cart.items = [];
  identifiedUser.cart.totalPrice = 0;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newOrder.save({ session: sess });
    await identifiedUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err.message);
    return next(new HttpError("Cannot place order", 500));
  }
  res.json({ order: newOrder.toObject({ getters: true }) });
};
exports.placeOrder = placeOrder;
exports.getOrders = getOrders;
