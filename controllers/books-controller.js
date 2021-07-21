const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Product = require("../models/Book");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const cloudinary=require('../cloudinary');
// const {uploadFile,getFileStream} =require('../s3');

const getBookList = async (req, res, next) => {
  let books;
  try {
    books = await Product.find({stockQuantity:{$gt:0}});
  } catch (err) {
    const error = new HttpError("Could not find the books");
    return next(error);
  }

  res.json({ books: books.map((book) => book.toObject({ getters: true })) });
};

// const getBookImage=(req,res,next)=>{
//   const key=req.params.key;
//   const readStream=getFileStream(key);
//   readStream.pipe(res);
// }

const getBookById = async (req, res, next) => {
  const bookId = req.params.bookId;
  let book;
  try {
    book = await Product.findById(bookId);
  } catch (error) {
    const errorMessage = new HttpError("Could not retrive the data", 500);
    return next(errorMessage);
  }

  if (!book) {
    return next(new HttpError("Could not find the book for the given id", 404));
  }

  res.json({ book: book.toObject({ getters: true }) });
};

const getBooksByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  let books;
  try {
    books = await Product.find({ createdBy: userId });
  } catch (err) {
    return next(new HttpError("Could not find the books for the user"));
  }
  res.json({ books: books.map((book) => book.toObject({ getters: true })) });
};

const createBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Please check your data", 422));
  }
  const { title, price, description, stockQuantity, filter, createdBy } =
    req.body;
    const result=await cloudinary.uploader.upload(req.file.path);
  console.log(result);
  const newBook = new Product({
    title,
    price,
    description,
    image: result.secure_url,
    branch: filter,
    stockQuantity,
    cloudinary_id:result.public_id
  });
  
  let user;
  try {
    user = await User.findById(createdBy);
  } catch (err) {
    const error = new HttpError("error!", 500);
    return next(error);
  }
  if (!user) {
    return next(new HttpError("Could not find the user", 404));
  }

  if (user.isAdmin) {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await newBook.save({ session: sess });
      await sess.commitTransaction();
    } catch (error) {
      const errorMessage = new HttpError("Product creation failed", 500);
      return next(errorMessage);
    }
    return res.status(201).json({ createdBook: newBook });
  } else {
    const error = new HttpError("Could not find you as admin!", 401);
    return next(error);
  }
};

const updateBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Your Input data contains errors", 422));
  }
  const { title, price, description, stockQuantity, filter } = req.body;
  const bookId = req.params.bookId;
  let updatedBook;
  try {
    updatedBook = await Product.findById(bookId);
  } catch (err) {
    const error = new HttpError("Could not find the book", 500);
    return next(error);
  }

  updatedBook.branch = filter;
  updatedBook.title = title;
  updatedBook.price = price;
  updatedBook.description = description;
  updatedBook.stockQuantity = stockQuantity;
  // updatedBook.image=req.file,
  // try{
  //   await updatedBook.save();
  // }catch(err){
  //   const error=new HttpError('Could not update the place',500);
  //   return next(error);
  // }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    const usersData = await User.find({ isAdmin: false });
    console.log(usersData);
    let i = 0;
    for (i = 0; i < usersData.length; i++) {
      let cartProductIndex = -1;
      if (usersData[i].cart.items.length > 0) {
        let prevProductprice = -1;
        cartProductIndex = usersData[i].cart.items.findIndex((item) => {
          return item.productId.toString() === bookId;
        });
        if (cartProductIndex != -1) {
          prevProductprice =
            usersData[i].cart.items[cartProductIndex].productPrice;
          usersData[i].cart.items[cartProductIndex].productPrice = price;
          console.log(prevProductprice);
          let prevTotalPrice = usersData[i].cart.totalPrice;
          let newTotalPrice =
            parseInt(prevTotalPrice - prevProductprice) + parseInt(price);

          console.log(prevTotalPrice);
          console.log(newTotalPrice);
          usersData[i].cart.totalPrice = newTotalPrice;
          await usersData[i].save({ session: sess });
        }
      }
    }
    await updatedBook.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err.message);
    return next(new HttpError("Error while updating", 500));
  }
  res.status(200).json({ book: updatedBook.toObject({ getters: true }) });
};

const deleteBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  let book;
  try {
    book = await Product.findById(bookId);
  } catch (err) {
    const error = new HttpError("Could not find the book", 500);
    return next(error);
  }

  if (!book) {
    const error = new HttpError("Could not find the book");
    return next(error);
  }
  const imagePath = `/uploads/images/db541740-e9f6-11eb-83bb-4baa1469afde.jpeg`;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await cloudinary.uploader.destroy(book.cloudinary_id);
    await book.remove({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not delete the book", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.json({ message: "Deleted" });
};

exports.updateBook = updateBook;
exports.createBook = createBook;
exports.getBookList = getBookList;
exports.getBookById = getBookById;
exports.deleteBook = deleteBook;
exports.getBooksByUserId = getBooksByUserId;
