const express = require("express");

const router = express.Router();

const authController = require(
  "../controllers/auth.controller"
);

const authenticate = require(
  "../middleware/authenticate.middleware"
);

const validate = require(
  "../../../shared/middleware/validate.middleware"
);

const asyncHandler = require(
  "../../../shared/middleware/asyncHandler.middleware"
);

const rateLimit = require(
  "../../../shared/middleware/rateLimit.middleware"
);

const {
  validateRegister,
} = require(
  "../validators/register.validator"
);

const {
  validateSendRegisterOtp,
} = require(
  "../validators/sendRegisterOtp.validator"
);

const {
  validateLogin,
} = require(
  "../validators/login.validator"
);

const {
  validateSendLoginOtp,
  validateLoginWithOtp,
} = require(
  "../validators/loginOtp.validator"
);

const {
  validateRefresh,
} = require(
  "../validators/refresh.validator"
);

const {
  validateChangePassword,
} = require(
  "../validators/changePassword.validator"
);

const {
  validateNotificationSettings,
} = require(
  "../validators/notificationSettings.validator"
);

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register/send-otp",
  rateLimit({
    keyPrefix: "register-otp",
    keyGenerator: (req) =>
      `${req.ip}:${req.body.email?.toLowerCase() || "unknown"}`,
    windowMs: 15 * 60 * 1000,
    max: 10,
    message:
      "Too many OTP requests. Please try again later.",
  }),
  validate(validateSendRegisterOtp),
  asyncHandler(
    authController.sendRegisterOtp.bind(
      authController
    )
  )
);

router.post(
  "/register",
  validate(validateRegister),
  asyncHandler(
    authController.register.bind(
      authController
    )
  )
);

router.post(
  "/login",
  validate(validateLogin),
  asyncHandler(
    authController.login.bind(
      authController
    )
  )
);

router.post(
  "/login/send-otp",
  rateLimit({
    keyPrefix: "login-otp",
    keyGenerator: (req) =>
      `${req.ip}:${req.body.email?.toLowerCase() || "unknown"}`,
    windowMs: 15 * 60 * 1000,
    max: 10,
    message:
      "Too many OTP requests. Please try again later.",
  }),
  validate(validateSendLoginOtp),
  asyncHandler(
    authController.sendLoginOtp.bind(
      authController
    )
  )
);

router.post(
  "/login/otp",
  validate(validateLoginWithOtp),
  asyncHandler(
    authController.loginWithOtp.bind(
      authController
    )
  )
);

router.post(
  "/refresh",
  validate(validateRefresh),
  asyncHandler(
    authController.refreshToken.bind(
      authController
    )
  )
);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  authenticate,
  asyncHandler(
    authController.getCurrentUser.bind(
      authController
    )
  )
);

router.get(
  "/users/search",
  authenticate,
  asyncHandler(
    authController.searchUserByEmail.bind(
      authController
    )
  )
);

router.put(
  "/me/password",
  authenticate,
  validate(
    validateChangePassword
  ),
  asyncHandler(
    authController.changePassword.bind(
      authController
    )
  )
);

router.put(
  "/me/notification-settings",
  authenticate,
  validate(
    validateNotificationSettings
  ),
  asyncHandler(
    authController.updateNotificationSettings.bind(
      authController
    )
  )
);

module.exports = router;
