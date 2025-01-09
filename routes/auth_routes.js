const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const validationRequest = require('../config/common/middlewares/validation_request');

router.post("/webapp/login", authController.webappAuthValidators, validationRequest, authController.loginToWebapp);
router.post("/mobile_app/login", authController.mobileappAuthValidators, validationRequest, authController.loginToMobileapp);
router.all("/logout", authController.logout);

module.exports = router;