const { body, validationResult } = require("express-validator");

const validateLogin = [
  body("email")
    .isString()
    .withMessage("Email must be text")
    .bail()
    .trim()
    .isLength({ max: 254 })
    .withMessage("Email must not exceed 254 characters")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("Password must be text")
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage("Password is required and must not exceed 128 characters"),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Do not echo credentials back in validation responses.
      const safeErrors = errors.array().map(({ location, path, msg }) => ({
        location,
        path,
        msg
      }));
      return res.status(400).json({
        message: "Validation failed.",
        errors: safeErrors
      });
    }

    next();
  }
];

module.exports = validateLogin;
