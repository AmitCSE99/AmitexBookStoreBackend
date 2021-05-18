const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/auth-controller");
router.get("/getUser/:userId", authController.getUser);
router.get("/getAddress/:userId/:addressId", authController.getAddress);
router.post(
  "/signup",
  [
    check("email").not().isEmpty().isEmail(),
    check("username").not().isEmpty(),
    check("password").isLength({ min: 6 }),
    check("address").isLength({ min: 6 }),
  ],
  authController.signUp
);
router.post("/login", authController.login);
router.patch(
  "/new-address",
  [check("enteredAddress").isLength({ min: 6 })],
  authController.patchNewAddress
);
router.patch("/remove-address", authController.removeAddress);
router.patch(
  "/edit-address/:addressId",
  [check("enteredAddress").isLength({ min: 6 })],
  authController.patchEditAddress
);

router.patch(
  "/edit-profile",
  [
    check("username").not().isEmpty(),
    check("email").not().isEmpty().normalizeEmail().isEmail(),
    check("contactNo").not().isEmpty().isNumeric(),
  ],
  authController.editProfile
);

router.patch(
  "/reset-password",
  [check("password").not().isEmpty(), check("confirmPassword").not().isEmpty()],
  authController.resetPassword
);

module.exports = router;
