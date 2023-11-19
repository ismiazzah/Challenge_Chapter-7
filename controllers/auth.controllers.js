const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;
const nodemailer = require("../utils/nodemailer");
module.exports = {
  register: async (req, res, next) => {
    try {
      let { name, email, password, password_confirmation } = req.body;
      if (password != password_confirmation) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "please ensure that the password and password confirmation match!",
          data: null,
        });
      }

      let userExist = await prisma.user.findUnique({ where: { email } });
      if (userExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "user has already been used!",
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.user.create({
        data: {
          name,
          email,
          password: encryptedPassword,
        },
      });
      io.emit("notif", {
        email,
        status: "Register",
        message: "Welcome New User ",
      });
      return res.status(201).json({
        status: true,
        message: "Created",
        err: null,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "invalid email or password!",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "invalid email or password!",
          data: null,
        });
      }

      let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);
      io.emit("notif", {
        email,
        status: "Login",
        message: "Success Login",
      });
      return res.status(200).json({
        status: true,
        message: "OK",
        err: null,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  emailForgetPassword: async (req, res, next) => {
    try {
      let { email } = req.body;

      let findUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!findUser) {
        return res.status(404).json({
          status: false,
          message: "Bad Request",
          err: "Your search did not return any results. Please try again with other information.",
        });
      }
      let token = jwt.sign({ email: findUser.email }, JWT_SECRET_KEY);
      let html = await nodemailer.getHtml("forgetPassword.ejs", {
        name: findUser.name,
        url: `http://localhost:3000/api/v1/accounts/password/reset?token=${token}`,
      });
      await nodemailer.sendEmail(email, "Email Forget Password", html);
      return res.status(200).json({
        status: true,
        message: "Succes Send Email Forget Password",
      });
    } catch (err) {
      next(err);
    }
  },
  forgetPassword: async (req, res, next) => {
    try {
      const { newPassword } = req.body;
      const { token } = req.query;
      console.log(newPassword);
      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(400).json({
            status: false,
            message: "Bad Request",
            err: err.message,
            data: null,
          });
        }
        const findUser = await prisma.user.findUnique({
          where: {
            email: decoded.email,
          },
        });
        if (!findUser) {
          return res.status(404).json({
            status: false,
            message: "Bad Request",
            err: "Your search did not return any results. Please try again with other information.",
          });
        }
        let encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = await prisma.user.update({
          where: {
            email: decoded.email,
          },
          data: {
            password: encryptedPassword,
          },
        });

        io.emit("notif", {
          email: decoded.email,
          status: "new-password",
          message: "Success Update Password",
        });

        return res.status(200).json({
          status: true,
          message: "Update Password",
          err: null,
          data: updatePassword,
        });
      });
    } catch (err) {
      next(err);
    }
  },
  PageForgetPassword: async (req, res, next) => {
    try {
      let { token } = req.query;
      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(400).json({
            status: false,
            message: "Bad Request",
            err: err.message,
            data: null,
          });
        }
        const findUser = await prisma.user.findUnique({
          where: {
            email: decoded.email,
          },
        });
        if (!findUser) {
          return res.status(404).json({
            status: false,
            message: "Bad Request",
            err: "Your search did not return any results. Please try again with other information.",
          });
        }
      });

      res.render("new-password", { token });
    } catch (err) {
      next(err);
    }
  },
  pageLogin: (req, res, next) => {
    try {
      res.render("login");
    } catch (err) {
      next(err);
    }
  },
  pageNotification: (req, res, next) => {
    try {
      res.render("pageNotification");
    } catch (err) {
      next(err);
    }
  },
};
