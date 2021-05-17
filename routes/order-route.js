const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const ordersController = require("../controllers/order-controller");
router.get("/get-orders/:userId", ordersController.getOrders);
router.post("/place-order", ordersController.placeOrder);
module.exports = router;
