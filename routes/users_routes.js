const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users_controller');
const validationRequest = require('../config/common/middlewares/validation_request');

router.get('/retreive_users', usersController.getUsers);
router.post('/create_user', usersController.createUserValidators, validationRequest, usersController.createUser);
router.put('/update_user/:id', usersController.updateUserValidators, validationRequest, usersController.updateUser);
router.delete('/delete_user/:id', usersController.deleteUserValidators, validationRequest, usersController.deleteUser);

module.exports = router;