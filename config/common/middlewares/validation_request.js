const {validationResult} = require("express-validator");
const RequestValidationError = require("../error/request_validation_error");

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        next(new RequestValidationError(errors.array()));
    }
    next();
};