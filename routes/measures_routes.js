const express = require('express');
const router = express.Router();
const measuresController = require('../controllers/measures_controller');
const upload_img = require('../config/common/middlewares/upload_img');
const validationRequest = require('../config/common/middlewares/validation_request');

router.get('/retreive_measures', measuresController.getMeasures);
router.post('/submit_measure', upload_img, measuresController.submitMeasureValidators, validationRequest, measuresController.submitMeasure);

module.exports = router;