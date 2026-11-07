const { body, validationResult } = require("express-validator");

const validateRegistration = [
  body("name")
    .isString()
    .withMessage("Name must be text")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .bail()
    .matches(/^[^<>]+$/)
    .withMessage("Name contains invalid characters"),

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
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters long")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  body("role")
    .optional()
    .isString()
    .withMessage("Role must be text")
    .bail()
    .isIn(["Client", "Freelancer"])
    .withMessage("Invalid user role"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return field names and messages only, never the rejected password value.
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

module.exports = validateRegistration;
