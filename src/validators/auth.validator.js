import { body, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation Error");
    error.status = 400;
    error.detail = errors.array();
    return next(error);
  }

  next();
};

export const registerValidator = [
  // Username validation
  body("username")
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 6, max: 10 })
    .withMessage("Username must be between 6 to 10 characters"),

  // Email validation
  body("email").isEmail().withMessage("Please provide a valid email"),

  // Password validation
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/)
    .withMessage(
      "Password must contain at least 1 letter, 1 number and be at least 6 characters long",
    ),

  validate,
];

export const loginValidator = [
  // Email validation
  body("email").isEmail().withMessage("Please enter a valid email"),

  // Password validation
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .notEmpty()
    .withMessage("Password is required"),

  validate,
];
