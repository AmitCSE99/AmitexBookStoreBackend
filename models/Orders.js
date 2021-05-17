const mongoose = require("mongoose");
// const uniqueValidator=require('mongoose-unique-validator');
const Schema = mongoose.Schema;
const ordersSchema = new Schema({
  products: [
    {
      title: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  user: {
    name: {
      type: String,
      required: true,
    },
    contactNo: {
      type: Number,
      required: true,
    },
  },
  address: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  subTotal: {
    type: Number,
    required: true,
  },
});
module.exports = mongoose.model("Order", ordersSchema);
