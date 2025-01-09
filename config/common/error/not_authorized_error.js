CustomError = require("./custom_error");

module.exports = class NotAuthorizedError extends CustomError{
    constructor(){
        super("Not authorzed");
        this.statusCode = 401;
    }

    generateErrors(){
        return [{message: "Not authorized"}];
    }
}