const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const booksController = require("../controllers/books-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
router.get("/", booksController.getBookList);
// router.get("/getImage/:key",booksController.getBookImage);

router.get("/:bookId", booksController.getBookById);
router.get("/userproduct/:userId", booksController.getBooksByUserId);

router.use(checkAuth);

router.post(
  "/new-book",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("price").not().isEmpty(),
    check("stockQuantity").not().isEmpty(),
  ],
  booksController.createBook
);

router.patch(
  "/:bookId",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("price").isAlphanumeric(),
    check("stockQuantity").not().isEmpty(),
  ],
  booksController.updateBook
);

router.delete("/:bookId", booksController.deleteBook);

module.exports = router;
