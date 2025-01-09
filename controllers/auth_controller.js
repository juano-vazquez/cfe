const config = require("../config/config");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { check } = require("express-validator");
const BadRequestError = require("../config/common/error/bad_request_error");

const domain = "cfe.mx";
privileges = {
  admin: "admin",
  employee: "employee",
};
const wrongCredentialsError = "Credenciales incorrectas";

const webappAuthValidators = [
  check("email")
    .notEmpty()
    .withMessage(wrongCredentialsError)
    .isEmail()
    .withMessage(wrongCredentialsError)
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      if (!user) {
        throw new BadRequestError(wrongCredentialsError);
      }

      const domain = value.split("@")[1];
      if (domain !== domain) {
        throw new BadRequestError(wrongCredentialsError);
      }

      return true;
    }),
  check("password")
    .notEmpty()
    .withMessage("Se requiere la contraseña")
    .isLength({ min: 12 })
    .withMessage("La contraseña debe de tener al menos 12 caracteres")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe de contener al menos una letra minúscula")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe de contener al menos una letra mayúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe de contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe de contener al menos un caracter especial")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.body.email });
      const passwordMatch = await bcrypt.compare(value, user.password);
      if (!passwordMatch) {
        throw new BadRequestError(wrongCredentialsError);
      }

      return true;
    }),
  check("").custom(async (value, { req }) => {
    const user = await User.findOne({ email: req.body.email });
    if (user.privilege != privileges.admin) {
      throw new BadRequestError(wrongCredentialsError);
    }

    return true;
  }),
];

const mobileappAuthValidators = [
  check("email")
    .notEmpty()
    .withMessage(wrongCredentialsError)
    .isEmail()
    .withMessage(wrongCredentialsError)
    .custom(async (value, { req }) => {
      console.log("EMAIL");
      const user = await User.findOne({ email: value });
      if (!user) {
        throw new BadRequestError(wrongCredentialsError);
      }

      const domain = value.split("@")[1];
      if (domain !== domain) {
        throw new BadRequestError(wrongCredentialsError);
      }

      return true;
    }),
  check("password")
    .notEmpty()
    .withMessage("Se requiere la contraseña")
    .custom(async (value, { req }) => {
      console.log("PWD");
      const user = await User.findOne({ email: req.body.email });
      const passwordMatch = await bcrypt.compare(value, user.password);
      if (!passwordMatch) {
        throw new BadRequestError(wrongCredentialsError);
      }

      return true;
    }),
  check("").custom(async (value, { req }) => {
    const user = await User.findOne({ email: req.body.email });
    if (user.privilege != privileges.employee) {
      throw new BadRequestError(wrongCredentialsError);
    }

    return true;
  }),
];

async function loginToWebapp(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new BadRequestError(wrongCredentialsError));
    }

    const pwdEqual = await bcrypt.compare(password, user.password);
    if (!pwdEqual) {
      return next(new BadRequestError(wrongCredentialsError));
    }

    if (user.privilege != privileges.admin) {
      return next(new BadRequestError(wrongCredentialsError));
    }

    // Generating authentiation token.
    const token = jwt.sign(
      { email, userId: user._id },
      config.tokens.secretKey,
      { expiresIn: "5h" }
    );

    // Saving user's cookies.
    /*
        const cookieOption = {
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            path: "/",
            httpOnly: true, // No accesible desde el cliente (JavaScript)
            secure: process.env.NODE_ENV === 'production', // Solo para HTTPS en producción
            sameSite: 'None', // Permite cookies entre sitios en el navegador
            maxAge: 24 * 60 * 60 * 1000 // Tiempo de vida de la cookie
        }
        res.cookie("new", token, cookieOption);
        console.log("Res.cookie: ", res.cookie);
        */

    req.session = {
      token,
      firstName: user.firstName,
      fisrtLastName: user.firstLastName,
      secondLastName: user.secondLastName,
      email: user.email,
      privilege: user.privilege,
    };
    console.log("Session when just logged in: ", req.session);

    console.log("Usuario logeado con éxito");
    res.status(200).json({ success: true, token: req.session.token });
  } catch (err) {
    return next(err);
  }
}

async function loginToMobileapp(req, res, next) {
  console.log("efefe");
  const { email, password } = req.body;

  console.log("REQUEST RECEIVED");

  try {
    console.log("TRY");
    const user = await User.findOne({ email });
    if (!user) {
      return next(new BadRequestError(wrongCredentialsError));
    }

    const pwdEqual = await bcrypt.compare(password, user.password);
    if (!pwdEqual) {
      return next(new BadRequestError(wrongCredentialsError));
    }

    if (user.privilege != privileges.employee) {
      return next(new BadRequestError(wrongCredentialsError));
    }

    // Generating authentiation token.
    const token = jwt.sign(
      { email, userId: user._id },
      config.tokens.secretKey,
      { expiresIn: "5h" }
    );

    // Saving user's cookies.
    req.session = {
      token,
      firstName: user.firstName,
      fisrtLastName: user.firstLastName,
      secondLastName: user.secondLastName,
      email: user.email,
      privilege: user.privilege,
    };

    console.log("Usuario logeado con éxito");
    //res.status(200).json( req.session );
    res.status(200).json({ success: true, token: req.session.token });
  } catch (err) {
    console.log(err);
    return next(err);
  }
}

async function logout(req, res, next) {
  req.session = null;
  console.log("Successfully logged out");
  res.status(200).json({ success: true, message: "Successfully logged out" });
}

module.exports = {
  webappAuthValidators,
  mobileappAuthValidators,
  loginToWebapp,
  loginToMobileapp,
  logout,
};
