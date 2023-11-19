const router = require("express").Router();
const {
  register,
  login,
  forgetPassword,
  emailForgetPassword,
  PageForgetPassword,
  pageLogin,
  pageNotification
} = require("../controllers/auth.controllers");
const { restrict } = require("../middlewares/auth.middlewares");

// render page login
router.get("/login", pageLogin);

// render page notification
router.get('/notification',pageNotification)
router.post("/register", register);
router.post("/login", login);

// forget password
router.post("/accounts/password/reset", emailForgetPassword);
router.post("/new-password", forgetPassword);
// end forget password

// render page forget password
router.get("/accounts/password/reset/", PageForgetPassword);

module.exports = router;
