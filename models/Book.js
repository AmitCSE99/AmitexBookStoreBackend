const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  branch: { type: String, required: true },
  stockQuantity: { type: Number, required: true },
  image: { type: String, required: true },
  cloudinary_id:{
    type:String,required:true
  }
});

module.exports = mongoose.model("Book", bookSchema);
