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

const {
  validateRegister,
} = require(
  "../validators/register.validator"
);

const {
  validateLogin,
} = require(
  "../validators/login.validator"
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