const config = require("../../config");
const jwt = require("jsonwebtoken");
const NotAuthorizedError = require("../error/not_authorized_error");

const currentUser = (req, res, next) => {
  console.log("REQ.SESSION: ", req.session);
  console.log("Received Headers:", req.headers);
  console.log("Received cookie:", req.headers.cookie);

  try {
    // Extracting content in request's authorization header to make sure there is an associated token.
    const token = req.session.token;
    if (!token) {
      console.log("No token");
      throw new NotAuthorizedError();
    }

    // Extracting payload by assuring that the user's token is valid.
    const payload = jwt.verify(token, config.tokens.secretKey);
    if (!payload) {
      console.log("Invalid");
      throw new NotAuthorizedError();
    }

    req.currentUser = payload;
    return next();
  } catch (err) {
    //console.log("Smnth else");
    return next(new NotAuthorizedError());
  }
};

module.exports = currentUser;
