const BadRequestError = require("../config/common/error/bad_request_error");
const Measure = require("../models/measure");
const User = require("../models/user");
const { check } = require("express-validator");
const config = require("../config/config");
const { format, parseISO } = require("date-fns");
const fs = require("fs");
const ftp = require("basic-ftp");
const mongoose = require("mongoose");
const commonStrings = require("../config/languages/locales/es.json").common;
const constants = require("../config/constants/constants.json");
const controllerStrings =
  require("../config/languages/locales/es.json").measuresController;

const submitMeasureValidators = [
  check("measure_value")
    .notEmpty()
    .withMessage(
      commonStrings.error.measureSubmissionErrors.measure_value.empty
    )
    .isNumeric()
    .withMessage(
      commonStrings.error.measureSubmissionErrors.measure_value.numeric
    ),
  check("measure_unit").custom((value, { req }) => {
    const validUnits = [
      constants.units.temperature.units.celsius.value,
      constants.units.temperature.units.fahrenheit.value,
      constants.units.pressure.units.kg_per_cm2.value,
      constants.units.pressure.units.psi.value,
      constants.units.flow.units.cm3_per_hr.value,
    ];
    console.log(Object.values(req.body));
    if (!validUnits.includes(value)) {
      throw new BadRequestError(
        commonStrings.error.measureSubmissionErrors.measure_unit
      );
    }

    return true;
  }),
  check("longitude")
    .notEmpty()
    .withMessage(commonStrings.error.measureSubmissionErrors.longitude.empty)
    .isNumeric()
    .withMessage(commonStrings.error.measureSubmissionErrors.longitude.numeric),
  check("latitude")
    .notEmpty()
    .withMessage(commonStrings.error.measureSubmissionErrors.latitude.empty)
    .isNumeric()
    .withMessage(commonStrings.error.measureSubmissionErrors.latitude.numeric),
  check().custom(async (value, { req }) => {
    const user = await User.findOne({ email: req.session.email });
    if (!user) {
      throw new NotFoundError(
        commonStrings.error.measureSubmissionErrors.employee.notFound
      );
    }

    if (!req.file) {
      throw new BadRequestError(
        commonStrings.error.measureSubmissionErrors.picture.empty
      );
    }

    return true;
  }),
];

async function getMeasures(req, res, next) {
  try {
    const measures = await Measure.find();
    const mappedMeasures = await Promise.all(
      measures.map(async (measureInfo) => {
        const employee = await User.findById(measureInfo.employee.toString());
        return {
          employeeId: employee ? employee._id : null,
          employee: employee
            ? `${employee.firstName} ${employee.firstLastName} ${employee.secondLastName}`
            : controllerStrings.deletedUser,
          date: format(measureInfo.date, commonStrings.formats.date),
          time: format(measureInfo.date, commonStrings.formats.timeHHMM),
          meterNumber: measureInfo.meter_number,
          meterCategory: measureInfo.meter_category,
          measureValue: measureInfo.measure_value,
          measureUnit: measureInfo.measure_unit,
          longitude: measureInfo.longitude,
          latitude: measureInfo.latitude,
          pictureUrl: measureInfo.pictureUrl,
        };
      })
    );

    console.log(commonStrings.success.measureRetreival);
    res
      .status(200)
      .json({
        success: true,
        message: commonStrings.success.measureRetreival,
        content: mappedMeasures,
      });
  } catch (err) {
    return next(err);
  }
}

async function submitMeasure(req, res, next) {
  const {
    meter_number,
    measure_value,
    measure_unit,
    meter_category,
    longitude,
    latitude,
  } = req.body;
  console.log("BODY: ", req.body);

  const user = await User.findOne({ email: req.session.email });
  if (!user) {
    throw new NotFoundError(
      commonStrings.error.measureSubmissionErrors.employee.notFound
    );
  }

  const client = new ftp.Client();
  const localFilePath = req.file.path;
  const remoteFileName = constants.prefixes.ftpImages + req.file.filename;

  console.log(config.servers.ftp.host);
  console.log(config.servers.ftp.user);
  console.log(config.servers.ftp.pwd);

  try {
    await client.access({
        // Uploading local file to remote ftp server.
        host: config.servers.ftp.host,
        user: config.servers.ftp.user,
        password: config.servers.ftp.pwd,
        secure: false
    });
    await client.uploadFrom(localFilePath, remoteFileName);
    console.log(commonStrings.success.measureSubmission); // file is located at https://.../file_name

    // Saving data submited.
    const measureToSubmit = new Measure({
      meter_number: meter_number || constants.falsyValues.num,
      measure_value: measure_value || constants.falsyValues.num,
      measure_unit: measure_unit || constants.falsyValues.str,
      meter_category: meter_category || constants.falsyValues.str,
      longitude: longitude || constants.falsyValues.num,
      latitude: latitude || constants.falsyValues.num,
      pictureUrl: remoteFileName,
      employee: new mongoose.Types.ObjectId(user._id),
    });

    await measureToSubmit.save();

    console.log(commonStrings.success.measureSubmission);
    res
      .status(200)
      .json({
        success: true,
        message: commonStrings.success.measureSubmission,
        content: measureToSubmit,
      });
  } catch (err) {
    console.log(err);
    return next(err);
  } finally {
    await client.close();
  }
}

module.exports = {
  submitMeasureValidators,
  getMeasures,
  submitMeasure,
};
