const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const cartController = require("../controllers/cart-controller");
router.patch("/addToCart", cartController.addToCart);
router.get("/items/:userId", cartController.getCart);
router.post("/items/remove", cartController.removeCart);
module.exports = router;
