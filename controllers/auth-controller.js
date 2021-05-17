const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const getUser = async (req, res, next) => {
  const userId = req.params.userId;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Something went wrong", 400);
    return next(error);
  }
  if (!identifiedUser) {
    return next(new HttpError("User Does not exists", 401));
  }
  res.json({ user: identifiedUser.toObject({ getters: true }) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  let loc = [];
  if (!errors.isEmpty()) {
    return next(new HttpError("Your Input data contains error", 422));
  }
  const { username, email, password, address, contactNo } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went error");
    return next(error);
  }
  if (existingUser) {
    return next(new HttpError("email already exists", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user", 500);
    return next(error);
  }

  let addressObject = {
    id: uuidv4(),
    location: address,
  };
  loc.push(addressObject);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    address: loc,
    isAdmin: false,
    contactNo,
    cart: { items: [], totalPrice: 0 },
  });
  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email, isAdmin: false },
      process.env.JWT_KEY,
      { expiresIn: "2h" }
    );
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Could not find the user", 500);
    return next(error);
  }
  if (!identifiedUser) {
    return next(new HttpError("Wrong data", 401));
  }
  if (identifiedUser && identifiedUser.isAdmin) {
    if (password === identifiedUser.password) {
      let token;
      try {
        token = jwt.sign(
          {
            userId: identifiedUser.id,
            email: identifiedUser.email,
            isAdmin: identifiedUser.isAdmin,
          },
          process.env.JWT_KEY,
          { expiresIn: "2h" }
        );
        return res.json({
          userId: identifiedUser.id,
          email: identifiedUser.email,
          token: token,
          isAdmin: true,
        });
      } catch (err) {
        const error = new HttpError("Could not authenticate", 401);
        return next(error);
      }
    } else {
      const error = new HttpError("Password is incorrect!", 401);
      return next(error);
    }
  }
  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, identifiedUser.password);
  } catch (err) {
    const error = new HttpError("Password is not correct", 500);
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError("Password is not correct", 500);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      {
        userId: identifiedUser.id,
        email: identifiedUser.email,
        isAdmin: false,
      },
      process.env.JWT_KEY,
      { expiresIn: "2h" }
    );
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
  res.json({
    userId: identifiedUser.id,
    email: identifiedUser.email,
    token: token,
    isAdmin: false,
  });
};

const editProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Your input data contains errors"));
  }
  const { userId, username, email, contactNo } = req.body;
  let identifiedUser;
  let arbitaryUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  try {
    arbitaryUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  if (identifiedUser._id.toString() !== arbitaryUser._id.toString()) {
    return next(new HttpError("Email already exists", 401));
  }
  identifiedUser.username = username;
  identifiedUser.contactNo = contactNo;
  identifiedUser.email = email;
  try {
    await identifiedUser.save();
  } catch (err) {
    return next(new HttpError("Could not edit your profile"));
  }
  res.json({ user: identifiedUser.toObject({ getters: true }) });
};

const resetPassword = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(new HttpError("Your Input data contains error"));
  }
  const { userId, password, confirmPassword } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  if (password !== confirmPassword) {
    return next(new HttpError("Passwords do not match"));
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user", 500);
    return next(error);
  }
  identifiedUser.password = hashedPassword;
  try {
    await identifiedUser.save();
  } catch (err) {
    return next(new HttpError("Could not reset the password"));
  }
  res.json({ user: identifiedUser.toObject({ getters: true }) });
};

const patchNewAddress = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Your data contains error"));
  }
  const { userId, enteredAddress } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  const avaliableAddresses = [...identifiedUser.address];
  let loc = {
    id: uuidv4(),
    location: enteredAddress,
  };
  avaliableAddresses.push(loc);
  identifiedUser.address = avaliableAddresses;
  try {
    await identifiedUser.save();
  } catch (err) {
    return next(new HttpError("Could not add the address", 500));
  }
  res.json({ user: identifiedUser.toObject({ getters: true }) });
};

const getAddress = async (req, res, next) => {
  const userId = req.params.userId;
  const addressId = req.params.addressId;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  const addressIndex = identifiedUser.address.findIndex((address) => {
    return address.id === addressId;
  });
  const enteredAddress = identifiedUser.address[addressIndex].location;
  res.json({ address: enteredAddress });
};

const patchEditAddress = async (req, res, next) => {
  const addressId = req.params.addressId;
  const { userId, enteredAddress } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could find the user", 401));
  }
  const addressIndex = identifiedUser.address.findIndex((address) => {
    return address.id === addressId;
  });
  identifiedUser.address[addressIndex].location = enteredAddress;
  try {
    await identifiedUser.save();
  } catch (err) {
    return next(new HttpError("Could not update the address", 500));
  }
  return res.json({ user: identifiedUser.toObject({ getters: true }) });
};

const removeAddress = async (req, res, next) => {
  const { userId, addressId } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!identifiedUser) {
    return next(new HttpError("Could not find the user", 401));
  }
  if (identifiedUser.address.length === 1) {
    return next(new HttpError("You need to have at least one address!", 500));
  }
  const updatedAddresses = identifiedUser.address.filter((address) => {
    return address.id !== addressId;
  });
  identifiedUser.address = updatedAddresses;
  try {
    await identifiedUser.save();
  } catch (err) {
    return next(new HttpError("Could not delete the address"));
  }
  res.json({ address: identifiedUser.address });
};

exports.removeAddress = removeAddress;
exports.getAddress = getAddress;
exports.patchEditAddress = patchEditAddress;
exports.patchNewAddress = patchNewAddress;
exports.signUp = signUp;
exports.login = login;
exports.getUser = getUser;
exports.editProfile = editProfile;
exports.resetPassword = resetPassword;
