const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minLength: 6 },
  address: [
    {
      id: { type: String, required: true },
      location: { type: String, required: true },
    },
  ],
  isAdmin: { type: Boolean, required: true },
  contactNo: { type: Number, required: true },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        productPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: { type: Number, required: true },
  },
});
userSchema.plugin(uniqueValidator);
module.exports = mongoose.model("User", userSchema);
